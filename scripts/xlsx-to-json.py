#!/usr/bin/env python3
"""
Convert the "Google Script Fold Leaders DataSource.xlsx" export into a JSON file
shaped exactly like the Mongo collections in src/lib/db.ts, so it can be loaded
with scripts/import-to-mongo.mjs.

Stdlib only (zipfile + xml.etree) -- no openpyxl/pandas needed.

Usage:
    python3 scripts/xlsx-to-json.py "Google Script Fold Leaders DataSource.xlsx" scripts/import-data.json
"""
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

NS = {'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
SHEET_FILES = {
    'Leaders': 'sheet1.xml',
    'Events': 'sheet2.xml',
    'Attendance': 'sheet3.xml',
    'PrayerList': 'sheet4.xml',
    'Members': 'sheet5.xml',
    'FollowUp': 'sheet6.xml',
    'Visitation': 'sheet7.xml',
}


def col_idx(cell_ref):
    letters = ''.join(c for c in cell_ref if c.isalpha())
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n - 1


def load_workbook(path):
    with zipfile.ZipFile(path) as z:
        shared = ET.fromstring(z.read('xl/sharedStrings.xml'))
        strings = [''.join((t.text or '') for t in si.findall('.//a:t', NS)) for si in shared.findall('a:si', NS)]

        sheets = {}
        for name, fname in SHEET_FILES.items():
            xml_bytes = z.read(f'xl/worksheets/{fname}')
            root = ET.fromstring(xml_bytes)
            rows = []
            for row in root.findall('.//a:sheetData/a:row', NS):
                cells = {}
                types = {}
                for c in row.findall('a:c', NS):
                    idx = col_idx(c.get('r'))
                    t = c.get('t')
                    v = c.find('a:v', NS)
                    val = v.text if v is not None else None
                    if t == 's' and val is not None:
                        val = strings[int(val)]
                    cells[idx] = val
                    types[idx] = t
                if any(v not in (None, '') for v in cells.values()):
                    maxidx = max(cells.keys())
                    rows.append({
                        'vals': [cells.get(i) for i in range(maxidx + 1)],
                        'types': [types.get(i) for i in range(maxidx + 1)],
                    })
            sheets[name] = rows
        return sheets


def excel_date(serial):
    """Excel/Sheets serial day number -> 'YYYY-MM-DD'."""
    if serial in (None, '', '#ERROR!'):
        return ''
    try:
        days = float(serial) - 25569  # 25569 = days between 1899-12-30 and 1970-01-01
        dt = datetime.fromtimestamp(round(days * 86400), tz=timezone.utc)
        return dt.strftime('%Y-%m-%d')
    except (ValueError, TypeError):
        return ''


def normalize_phone(raw, cell_type, warnings, context):
    if raw in (None, '', '#ERROR!'):
        if raw == '#ERROR!':
            warnings.append(f'{context}: phone cell is #ERROR! in the sheet, left blank')
        return ''
    if cell_type == 's':
        return str(raw).strip()
    try:
        digits = str(int(round(float(raw))))
    except (ValueError, TypeError):
        return str(raw).strip()
    if digits.startswith('233') and len(digits) == 12:
        digits = '0' + digits[3:]
    elif len(digits) == 9:
        digits = '0' + digits
    if len(digits) != 10:
        warnings.append(f'{context}: phone "{raw}" normalized to "{digits}" ({len(digits)} digits, expected 10) -- check by hand')
    return digits


def cell(row, i):
    vals = row['vals']
    return vals[i] if i < len(vals) else None


def ctype(row, i):
    types = row['types']
    return types[i] if i < len(types) else None


def convert(sheets):
    warnings = []
    out = {
        'leaders': {},
        'unassigned': [],
        'events': [],
        'attendance': [],
        'prayerList': [],
        'submissions': [],
    }

    # Leaders
    for row in sheets['Leaders'][1:]:
        lid = cell(row, 0)
        if not lid:
            continue
        out['leaders'][lid] = {
            'id': lid,
            'name': cell(row, 1) or '',
            'addedAt': (excel_date(cell(row, 2)) + 'T00:00:00.000Z') if cell(row, 2) else datetime.now(timezone.utc).isoformat(),
            'members': [],
        }

    # Members (assigned -> nested under their leader; unassigned -> own collection)
    for i, row in enumerate(sheets['Members'][1:], start=2):
        name = cell(row, 1)
        if not name:
            continue
        lid = cell(row, 0)
        phone = normalize_phone(cell(row, 2), ctype(row, 2), warnings, f'Members row {i} ({name})')
        added = cell(row, 3)
        added_iso = (excel_date(added) + 'T00:00:00.000Z') if added else datetime.now(timezone.utc).isoformat()
        member = {'name': name, 'phone': phone, 'leaderId': lid or '', 'addedAt': added_iso}
        if lid and lid in out['leaders']:
            out['leaders'][lid]['members'].append(member)
        elif lid:
            warnings.append(f'Members row {i}: leaderId "{lid}" not found in Leaders sheet, filed as unassigned')
            out['unassigned'].append({**member, 'leaderId': ''})
        else:
            out['unassigned'].append(member)

    out['leaders'] = list(out['leaders'].values())

    # Events
    for row in sheets['Events'][1:]:
        eid = cell(row, 0)
        if not eid:
            continue
        out['events'].append({
            'id': eid,
            'name': cell(row, 1) or '',
            'type': cell(row, 2) or 'OT',
            'date': excel_date(cell(row, 3)),
            'createdAt': cell(row, 4) or datetime.now(timezone.utc).isoformat(),
            'createdBy': cell(row, 5) or 'admin',
        })

    # Attendance
    for row in sheets['Attendance'][1:]:
        member_name = cell(row, 5)
        if not member_name:
            continue
        out['attendance'].append({
            'markedAt': cell(row, 0) or '',
            'eventId': cell(row, 1) or '',
            'eventName': cell(row, 2) or '',
            'leaderId': cell(row, 3) or '',
            'leaderName': cell(row, 4) or '',
            'memberName': member_name,
            'present': cell(row, 6) in ('1', 1, True),
        })

    # PrayerList
    for i, row in enumerate(sheets['PrayerList'][1:], start=2):
        member_name = cell(row, 3)
        if not member_name:
            continue
        out['prayerList'].append({
            'addedAt': cell(row, 0) or '',
            'leaderId': cell(row, 1) or '',
            'leaderName': cell(row, 2) or '',
            'memberName': member_name,
            'memberPhone': normalize_phone(cell(row, 4), ctype(row, 4), warnings, f'PrayerList row {i} ({member_name})'),
            'reason': cell(row, 5) or '',
            'active': cell(row, 6) in ('1', 1, True),
        })

    # FollowUp -> submissions (type: 'followup')
    for i, row in enumerate(sheets['FollowUp'][1:], start=2):
        member_name = cell(row, 5)
        if not member_name:
            continue
        out['submissions'].append({
            'type': 'followup',
            'submittedAt': cell(row, 0) or '',
            'period': cell(row, 1) or '',
            'leaderId': cell(row, 2) or '',
            'leaderName': cell(row, 3) or '',
            'memberId': cell(row, 4) or '',
            'memberName': member_name,
            'memberPhone': normalize_phone(cell(row, 6), ctype(row, 6), warnings, f'FollowUp row {i} ({member_name})'),
            'date': excel_date(cell(row, 7)),
            'context': cell(row, 8) or '',
            'method': cell(row, 9) or '',
            'response': cell(row, 10) or '',
            'prayerNeeds': cell(row, 11) or '',
        })

    # Visitation -> submissions (type: 'visitation')
    # One historical row has an extra MemberID column the header never got updated for
    # (12 cells instead of 11), so branch on row width rather than trust the header.
    for i, row in enumerate(sheets['Visitation'][1:], start=2):
        width = len(row['vals'])
        if width >= 12:
            member_id, member_name, phone, date, reason, obs, prayer, outcomes = (
                cell(row, 4), cell(row, 5), cell(row, 6), cell(row, 7),
                cell(row, 8), cell(row, 9), cell(row, 10), cell(row, 11),
            )
            phone_type = ctype(row, 6)
        else:
            member_id, member_name, phone, date, reason, obs, prayer, outcomes = (
                '', cell(row, 4), cell(row, 5), cell(row, 6),
                cell(row, 7), cell(row, 8), cell(row, 9), cell(row, 10),
            )
            phone_type = ctype(row, 5)
        if not member_name:
            continue
        out['submissions'].append({
            'type': 'visitation',
            'submittedAt': cell(row, 0) or '',
            'period': cell(row, 1) or '',
            'leaderId': cell(row, 2) or '',
            'leaderName': cell(row, 3) or '',
            'memberId': member_id or '',
            'memberName': member_name,
            'memberPhone': normalize_phone(phone, phone_type, warnings, f'Visitation row {i} ({member_name})'),
            'date': excel_date(date),
            'reason': reason or '',
            'observations': obs or '',
            'prayerNeeds': prayer or '',
            'outcomes': outcomes or '',
        })

    return out, warnings


def main():
    if len(sys.argv) != 3:
        print('Usage: python3 xlsx-to-json.py <input.xlsx> <output.json>', file=sys.stderr)
        sys.exit(1)

    import json
    sheets = load_workbook(sys.argv[1])
    data, warnings = convert(sheets)

    with open(sys.argv[2], 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Wrote {sys.argv[2]}:")
    print(f"  {len(data['leaders'])} leaders, {sum(len(l['members']) for l in data['leaders'])} assigned members, {len(data['unassigned'])} unassigned")
    print(f"  {len(data['events'])} events, {len(data['attendance'])} attendance records")
    print(f"  {len(data['prayerList'])} prayer requests")
    print(f"  {len(data['submissions'])} follow-up/visitation submissions")
    if warnings:
        print(f"\n{len(warnings)} data-quality warnings (fix by hand in the sheet or after import if it matters):")
        for w in warnings:
            print(f"  - {w}")


if __name__ == '__main__':
    main()
