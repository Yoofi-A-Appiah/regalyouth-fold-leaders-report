import { Leader, Member, EventItem } from './types';

export const INITIAL_LEADERS: Leader[] = [
  {
    "id": "FL-001",
    "name": "Samuel Mensah",
    "members": [
      {
        "name": "Azariah Cleland Okine",
        "phone": "0599712563"
      },
      {
        "name": "Ebenezer Ativi",
        "phone": ""
      },
      {
        "name": "Elliot Akoh Nartey",
        "phone": "0534022961"
      },
      {
        "name": "Nyata Dennis",
        "phone": "0593200087"
      },
      {
        "name": "Moses Nyako",
        "phone": "0593200087"
      }
    ]
  },
  {
    "id": "FL-002",
    "name": "Emmanuel Datsa",
    "members": [
      {
        "name": "Tuglo-Mawuli Kekeli Ethel Afi",
        "phone": "0246388691"
      },
      {
        "name": "Eugene",
        "phone": ""
      },
      {
        "name": "Ewoenam",
        "phone": "0201205334"
      },
      {
        "name": "Ewurasi Appiah",
        "phone": "0534984686"
      }
    ]
  },
  {
    "id": "FL-003",
    "name": "Racheal Adu",
    "members": [
      {
        "name": "Tuglo-Mawuli Kekeli Ethel Afi",
        "phone": "0246388691"
      },
      {
        "name": "Amanda Ansah Asare",
        "phone": ""
      },
      {
        "name": "Eugene",
        "phone": ""
      },
      {
        "name": "Ewoenam",
        "phone": "0201205334"
      },
      {
        "name": "Ewurasi Appiah",
        "phone": "0534984686"
      }
    ]
  },
  {
    "id": "FL-004",
    "name": "Alice Acheampong",
    "members": [
      {
        "name": "Mahama Aisha",
        "phone": "0245304917"
      },
      {
        "name": "Agbo Jefter Senya",
        "phone": "0540689564"
      },
      {
        "name": "Prince Ativi",
        "phone": ""
      },
      {
        "name": "Francisca Boateng Duodo",
        "phone": "0595051138"
      },
      {
        "name": "Kofi Asiamah",
        "phone": ""
      },
      {
        "name": "Innocent Kwaku Bassah",
        "phone": "0597001485"
      }
    ]
  },
  {
    "id": "FL-005",
    "name": "Joel Amegashie",
    "members": [
      {
        "name": "Ikecabel Kamedzi Yamoah",
        "phone": "0537661006"
      },
      {
        "name": "Kingsley manu",
        "phone": ""
      },
      {
        "name": "Emmanuel Blay",
        "phone": "0549021954"
      },
      {
        "name": "Paul Ankrah",
        "phone": ""
      },
      {
        "name": "Genevieve Nana Ama Asante",
        "phone": "0207994164"
      },
      {
        "name": "Daniel",
        "phone": "0506420060"
      }
    ]
  },
  {
    "id": "FL-006",
    "name": "Randy Sefa",
    "members": [
      {
        "name": "Gordor Deborah Selasie",
        "phone": "0537529771"
      },
      {
        "name": "Roland",
        "phone": "0201274373"
      },
      {
        "name": "Oscar Klobodu",
        "phone": ""
      },
      {
        "name": "Asare Gideon Dartey",
        "phone": "0248944176"
      },
      {
        "name": "Shadow",
        "phone": "0246067969"
      },
      {
        "name": "Hannah Obaayaa Tandoh",
        "phone": "0599568275"
      }
    ]
  },
  {
    "id": "FL-007",
    "name": "Justina Archer",
    "members": [
      {
        "name": "Siaw Benedict",
        "phone": "0532829652"
      },
      {
        "name": "Deborah Kwao",
        "phone": ""
      },
      {
        "name": "Victoria Ayi",
        "phone": "0556300909"
      },
      {
        "name": "Lady Pearl Oduro-kwarteng",
        "phone": ""
      },
      {
        "name": "Mercy",
        "phone": ""
      }
    ]
  },
  {
    "id": "FL-008",
    "name": "Redeemer Agbonuglah",
    "members": [
      {
        "name": "Caleb Barima Agyare",
        "phone": "0591595249"
      },
      {
        "name": "Mercedes Amanor",
        "phone": ""
      },
      {
        "name": "Kweku Berkoh",
        "phone": "0508056926"
      },
      {
        "name": "Benjamin baffour",
        "phone": "0241561172"
      },
      {
        "name": "Notignaba Alfred",
        "phone": "0551040022"
      },
      {
        "name": "Yaw Frimpong Kokoski",
        "phone": "0536406362"
      }
    ]
  },
  {
    "id": "FL-009",
    "name": "Philip Amanor",
    "members": [
      {
        "name": "Desmond Aidoo",
        "phone": "0245121343"
      },
      {
        "name": "Raymond Adu",
        "phone": ""
      },
      {
        "name": "Micky",
        "phone": "0541773847"
      },
      {
        "name": "Stephen Erzah Yalley",
        "phone": "0572518338"
      },
      {
        "name": "Edmond Kobi Mensah",
        "phone": "0598647108"
      },
      {
        "name": "Tenga Joseph Banga",
        "phone": "0554452739"
      }
    ]
  },
  {
    "id": "FL-010",
    "name": "Selina",
    "members": [
      {
        "name": "Rick Selorm Mensah",
        "phone": "+233 205073529"
      },
      {
        "name": "Paul Mensah Ativi",
        "phone": "0594064328"
      },
      {
        "name": "Maame Afua Wryter",
        "phone": ""
      },
      {
        "name": "Kimathi Kfi Bona Osei-Appaw",
        "phone": "0264131886"
      }
    ]
  },
  {
    "id": "FL-011",
    "name": "Rejoice Mamle",
    "members": [
      {
        "name": "Ansah Priscilla Boatema",
        "phone": "0257084001"
      },
      {
        "name": "Angela",
        "phone": "0557636686"
      },
      {
        "name": "Benedict",
        "phone": ""
      },
      {
        "name": "Yooku Appiah",
        "phone": ""
      },
      {
        "name": "Patrick Kofi Adem",
        "phone": "0241972257"
      }
    ]
  },
  {
    "id": "FL-012",
    "name": "Adelaide Siripi",
    "members": [
      {
        "name": "Ablorh Magdalene",
        "phone": "0559220411"
      },
      {
        "name": "John Nomo Djabanor",
        "phone": "0541549121"
      },
      {
        "name": "Sedinam Agbenyo",
        "phone": ""
      },
      {
        "name": "Nana FLorence",
        "phone": "0249587361"
      },
      {
        "name": "Nesta Cleland Okine",
        "phone": "0559714595"
      }
    ]
  },
  {
    "id": "FL-013",
    "name": "Adomaa Nsiah",
    "members": [
      {
        "name": "Lisa Kesewaa Okai",
        "phone": "0508726420"
      },
      {
        "name": "Keziah Ewurabena Larbey",
        "phone": "0509980561"
      },
      {
        "name": "Esther Quansah",
        "phone": ""
      },
      {
        "name": "Sefakor Agbenyo",
        "phone": ""
      },
      {
        "name": "Vanessa",
        "phone": "0509980550"
      },
      {
        "name": "Esther Stanza",
        "phone": "0547792460"
      }
    ]
  },
  {
    "id": "FL-014",
    "name": "Yoofi Appiah",
    "members": [
      {
        "name": "Clinton",
        "phone": "0206691726"
      },
      {
        "name": "Glorai",
        "phone": "0549021954"
      },
      {
        "name": "Prince Osei",
        "phone": "0247651161"
      },
      {
        "name": "Gideon Sowah",
        "phone": "0509889452"
      },
      {
        "name": "Joel Anku",
        "phone": "+233209546253"
      }
    ]
  },
  {
    "id": "FL-015",
    "name": "Blessing Lartey",
    "members": [
      {
        "name": "Highness Mildred",
        "phone": "0543018122"
      },
      {
        "name": "Kelvin",
        "phone": "0534966474"
      },
      {
        "name": "Anita Foli",
        "phone": "0248226635"
      },
      {
        "name": "Penemang",
        "phone": "0557406339"
      },
      {
        "name": "Sethina",
        "phone": "0508797923"
      }
    ]
  },
  {
    "id": "FL-016",
    "name": "Elorm Addo",
    "members": [
      {
        "name": "Uriel",
        "phone": "0503692760"
      },
      {
        "name": "Eunice Lamisi",
        "phone": "0557207811"
      },
      {
        "name": "Talata",
        "phone": "0543884189"
      },
      {
        "name": "Daniel",
        "phone": "0591558422"
      },
      {
        "name": "Wycznski",
        "phone": "0244246066"
      }
    ]
  },
  {
    "id": "FL-017",
    "name": "Korankye Turkson",
    "members": [
      {
        "name": "Binangnam meshack",
        "phone": "0257839344"
      },
      {
        "name": "Dorcas Adaboro",
        "phone": "05339947054"
      },
      {
        "name": "Anderian Bernie",
        "phone": "0241901627"
      },
      {
        "name": "Roberta Ackon",
        "phone": "0503982423"
      },
      {
        "name": "Kwao Desmond Djarbartey",
        "phone": "0257100685"
      }
    ]
  },
  {
    "id": "FL-18",
    "name": "Abeiku Acquaah",
    "members": [
      {
        "name": "Amexo Beatrice",
        "phone": "0257795275"
      },
      {
        "name": "Ivan Tetteh",
        "phone": "256427250"
      },
      {
        "name": "Vivian Oweidura",
        "phone": "233547535994"
      }
    ]
  }
];

export const INITIAL_UNASSIGNED: Member[] = [
  {
    "leaderId": "",
    "name": "Adel Yelbert",
    "phone": "503333098"
  },
  {
    "leaderId": "",
    "name": "Isabella Akushika Mensah",
    "phone": "50682372"
  },
  {
    "leaderId": "",
    "name": "Jennifer Batsa",
    "phone": "248311904"
  },
  {
    "leaderId": "",
    "name": "Irene Adzraku",
    "phone": "542130351"
  },
  {
    "leaderId": "",
    "name": "Adzraku Issabella Delali Aku",
    "phone": "0533559190"
  },
  {
    "leaderId": "",
    "name": "Nhyiraba Oye Agyakwa",
    "phone": "591071235"
  },
  {
    "leaderId": "",
    "name": "Nyamedor Anyanfowaa-Mensah",
    "phone": "591106627"
  },
  {
    "leaderId": "",
    "name": "Bismark Elikplem Yaw Agbenyegah",
    "phone": "205563495"
  },
  {
    "leaderId": "",
    "name": "Agnes Bukari",
    "phone": "247280901"
  },
  {
    "leaderId": "",
    "name": "Martha Bobeyir",
    "phone": "540389679"
  },
  {
    "leaderId": "",
    "name": "Martha Bobeyir",
    "phone": "540389679"
  },
  {
    "leaderId": "",
    "name": "Fedosia",
    "phone": "536112646"
  },
  {
    "leaderId": "",
    "name": "Janel Besiwah Sam",
    "phone": "559518132"
  },
  {
    "leaderId": "",
    "name": "Hellen Frimpong",
    "phone": "536387884"
  },
  {
    "leaderId": "",
    "name": "Teye Margaret",
    "phone": "534548600"
  },
  {
    "leaderId": "",
    "name": "Joshua Yenimi Yamba",
    "phone": "539573791"
  },
  {
    "leaderId": "",
    "name": "Faustina Adompoka",
    "phone": "256355823"
  },
  {
    "leaderId": "",
    "name": "Eugenia Amegashie",
    "phone": "201205334"
  },
  {
    "leaderId": "",
    "name": "Agudze Richard",
    "phone": "532487012"
  },
  {
    "leaderId": "",
    "name": "David Adu Dankwa",
    "phone": "502755231"
  },
  {
    "leaderId": "",
    "name": "Nhyira Antwi",
    "phone": "244507327"
  },
  {
    "leaderId": "",
    "name": "Dora Kwao Djarbarkuor",
    "phone": "530668374"
  },
  {
    "leaderId": "",
    "name": "Michael Nartey",
    "phone": "552400692"
  },
  {
    "leaderId": "",
    "name": "John Nomo Djabanor",
    "phone": "541549121"
  },
  {
    "leaderId": "",
    "name": "Mensah Felicia",
    "phone": "539391148"
  },
  {
    "leaderId": "",
    "name": "Musah Zakia Jennifer",
    "phone": "246640724"
  },
  {
    "leaderId": "",
    "name": "Caleb Nana Kwame Asumadu",
    "phone": "502363128"
  },
  {
    "leaderId": "",
    "name": "Maame Akua Asumadu",
    "phone": "242169088"
  },
  {
    "leaderId": "",
    "name": "Ewurama Adomako-Mensah",
    "phone": "#ERROR!"
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    "id": "ev-1787046438032",
    "name": "It's a Matter Of Life & Death",
    "type": "YM",
    "date": "2026-08-17T00:00:00.000Z",
    "createdAt": "2026-08-18T09:47:18.032Z",
    "createdBy": "admin"
  },
  {
    "id": "ev-1783342658312",
    "name": "Youth Meeting",
    "type": "YM",
    "date": "2026-07-06T00:00:00.000Z",
    "createdAt": "2026-07-06T12:57:38.312Z",
    "createdBy": "admin"
  }
];
