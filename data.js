// =============================================================
// CHRONOTRAIN — Station & route dataset
// =============================================================
// Coverage: continental Asia (East, Southeast, South, Central, West).
// Times are real-ish, based on actual published rail services c. 2024–26.
// Cross-border friction is folded into adjacent segments where relevant.
// Suspended or war-disrupted services are excluded; countries without
// scheduled intercity passenger rail are listed below for hatching.

window.STATIONS = [

  // ==========  CHINA — North & Northeast  ==========
  { id: "beijing",       name: "Beijing",         native: "北京",     country: "CN", lat: 39.91, lng: 116.40 },
  { id: "tianjin",       name: "Tianjin",         native: "天津",     country: "CN", lat: 39.13, lng: 117.20 },
  { id: "shijiazhuang",  name: "Shijiazhuang",    native: "石家庄",   country: "CN", lat: 38.04, lng: 114.51 },
  { id: "taiyuan",       name: "Taiyuan",         native: "太原",     country: "CN", lat: 37.87, lng: 112.55 },
  { id: "hohhot",        name: "Hohhot",          native: "呼和浩特", country: "CN", lat: 40.84, lng: 111.75 },
  { id: "datong",        name: "Datong",          native: "大同",     country: "CN", lat: 40.09, lng: 113.30 },
  { id: "baoding",       name: "Baoding",         native: "保定",     country: "CN", lat: 38.87, lng: 115.46 },
  { id: "handan",        name: "Handan",          native: "邯郸",     country: "CN", lat: 36.62, lng: 114.49 },
  { id: "shenyang",      name: "Shenyang",        native: "沈阳",     country: "CN", lat: 41.81, lng: 123.43 },
  { id: "harbin",        name: "Harbin",          native: "哈尔滨",   country: "CN", lat: 45.80, lng: 126.54 },
  { id: "changchun",     name: "Changchun",       native: "长春",     country: "CN", lat: 43.82, lng: 125.32 },
  { id: "dalian",        name: "Dalian",          native: "大连",     country: "CN", lat: 38.91, lng: 121.62 },
  { id: "dandong",       name: "Dandong",         native: "丹东",     country: "CN", lat: 40.13, lng: 124.39 },
  { id: "manzhouli",     name: "Manzhouli",       native: "满洲里",   country: "CN", lat: 49.59, lng: 117.43 },
  { id: "erenhot",       name: "Erenhot",         native: "二连浩特", country: "CN", lat: 43.65, lng: 111.97 },

  // ==========  CHINA — East coast (Jinghu HSR + Jiangsu/Shanghai/Fujian)  ==========
  { id: "cangzhou",      name: "Cangzhou",        native: "沧州",     country: "CN", lat: 38.30, lng: 116.83 },
  { id: "dezhou",        name: "Dezhou",          native: "德州",     country: "CN", lat: 37.45, lng: 116.30 },
  { id: "jinan",         name: "Jinan",           native: "济南",     country: "CN", lat: 36.65, lng: 117.13 },
  { id: "taian",         name: "Tai'an",          native: "泰安",     country: "CN", lat: 36.19, lng: 117.09 },
  { id: "qingdao",       name: "Qingdao",         native: "青岛",     country: "CN", lat: 36.07, lng: 120.38 },
  { id: "xuzhou",        name: "Xuzhou",          native: "徐州",     country: "CN", lat: 34.27, lng: 117.18 },
  { id: "bengbu",        name: "Bengbu",          native: "蚌埠",     country: "CN", lat: 32.93, lng: 117.36 },
  { id: "nanjing",       name: "Nanjing",         native: "南京",     country: "CN", lat: 32.06, lng: 118.80 },
  { id: "wuxi",          name: "Wuxi",            native: "无锡",     country: "CN", lat: 31.49, lng: 120.31 },
  { id: "suzhou_js",     name: "Suzhou",          native: "苏州",     country: "CN", lat: 31.30, lng: 120.59 },
  { id: "shanghai",      name: "Shanghai",        native: "上海",     country: "CN", lat: 31.23, lng: 121.47 },
  { id: "hangzhou",      name: "Hangzhou",        native: "杭州",     country: "CN", lat: 30.27, lng: 120.16 },
  { id: "hefei",         name: "Hefei",           native: "合肥",     country: "CN", lat: 31.82, lng: 117.23 },
  { id: "nanchang",      name: "Nanchang",        native: "南昌",     country: "CN", lat: 28.68, lng: 115.89 },
  { id: "fuzhou",        name: "Fuzhou",          native: "福州",     country: "CN", lat: 26.08, lng: 119.30 },
  { id: "xiamen",        name: "Xiamen",          native: "厦门",     country: "CN", lat: 24.48, lng: 118.09 },

  // ==========  CHINA — Central + Jingguang HSR  ==========
  { id: "zhengzhou",     name: "Zhengzhou",       native: "郑州",     country: "CN", lat: 34.75, lng: 113.65 },
  { id: "anyang",        name: "Anyang",          native: "安阳",     country: "CN", lat: 36.10, lng: 114.35 },
  { id: "wuhan",         name: "Wuhan",           native: "武汉",     country: "CN", lat: 30.59, lng: 114.31 },
  { id: "xinyang",       name: "Xinyang",         native: "信阳",     country: "CN", lat: 32.13, lng: 114.07 },
  { id: "changsha",      name: "Changsha",        native: "长沙",     country: "CN", lat: 28.23, lng: 112.94 },
  { id: "hengyang",      name: "Hengyang",        native: "衡阳",     country: "CN", lat: 26.90, lng: 112.61 },
  { id: "shaoguan",      name: "Shaoguan",        native: "韶关",     country: "CN", lat: 24.81, lng: 113.59 },

  // ==========  CHINA — West (Lan-Xin HSR + Sichuan + Tibet)  ==========
  { id: "xian",          name: "Xi'an",           native: "西安",     country: "CN", lat: 34.27, lng: 108.94 },
  { id: "lanzhou",       name: "Lanzhou",         native: "兰州",     country: "CN", lat: 36.06, lng: 103.83 },
  { id: "xining",        name: "Xining",          native: "西宁",     country: "CN", lat: 36.62, lng: 101.78 },
  { id: "wuwei",         name: "Wuwei",           native: "武威",     country: "CN", lat: 37.93, lng: 102.64 },
  { id: "zhangye",       name: "Zhangye",         native: "张掖",     country: "CN", lat: 38.93, lng: 100.45 },
  { id: "jiayuguan",     name: "Jiayuguan",       native: "嘉峪关",   country: "CN", lat: 39.80, lng: 98.27  },
  { id: "hami",          name: "Hami",            native: "哈密",     country: "CN", lat: 42.83, lng: 93.51  },
  { id: "turpan",        name: "Turpan",          native: "吐鲁番",   country: "CN", lat: 42.93, lng: 89.16  },
  { id: "urumqi",        name: "Urumqi",          native: "乌鲁木齐", country: "CN", lat: 43.83, lng: 87.62  },
  { id: "alashankou",    name: "Alashankou",      native: "阿拉山口", country: "CN", lat: 45.18, lng: 82.55  },
  { id: "lhasa",         name: "Lhasa",           native: "拉萨",     country: "CN", lat: 29.65, lng: 91.14  },
  { id: "chongqing",     name: "Chongqing",       native: "重庆",     country: "CN", lat: 29.56, lng: 106.55 },
  { id: "chengdu",       name: "Chengdu",         native: "成都",     country: "CN", lat: 30.66, lng: 104.06 },

  // ==========  CHINA — South & Southwest  ==========
  { id: "guangzhou",     name: "Guangzhou",       native: "广州",     country: "CN", lat: 23.13, lng: 113.26 },
  { id: "shenzhen",      name: "Shenzhen",        native: "深圳",     country: "CN", lat: 22.54, lng: 114.06 },
  { id: "hongkong",      name: "Hong Kong",       native: "香港",     country: "HK", lat: 22.30, lng: 114.17 },
  { id: "nanning",       name: "Nanning",         native: "南宁",     country: "CN", lat: 22.82, lng: 108.37 },
  { id: "kunming",       name: "Kunming",         native: "昆明",     country: "CN", lat: 25.04, lng: 102.71 },
  { id: "guiyang",       name: "Guiyang",         native: "贵阳",     country: "CN", lat: 26.59, lng: 106.71 },
  { id: "pingxiang_cn",  name: "Pingxiang",       native: "凭祥",     country: "CN", lat: 22.10, lng: 106.76 },

  // ==========  MONGOLIA  ==========
  { id: "zamiin_uud",    name: "Zamiin-Üüd", native: "Замын-Үүд",      country: "MN", lat: 43.72, lng: 111.90 },
  { id: "choir",         name: "Choir", native: "Чойр",           country: "MN", lat: 46.36, lng: 108.36 },
  { id: "ulaanbaatar",   name: "Ulaanbaatar", native: "Улаанбаатар",     country: "MN", lat: 47.92, lng: 106.92 },
  { id: "darkhan",       name: "Darkhan", native: "Дархан",         country: "MN", lat: 49.49, lng: 105.92 },
  { id: "sukhbaatar",    name: "Sükhbaatar", native: "Сүхбаатар",      country: "MN", lat: 50.24, lng: 106.20 },

  // ==========  RUSSIA (Asia + European link)  ==========
  { id: "naushki",       name: "Naushki", native: "Наушки",         country: "RU", lat: 50.39, lng: 106.10 },
  { id: "ulan_ude",      name: "Ulan-Ude", native: "Улан-Удэ",        country: "RU", lat: 51.83, lng: 107.58 },
  { id: "irkutsk",       name: "Irkutsk", native: "Иркутск",         country: "RU", lat: 52.29, lng: 104.30 },
  { id: "krasnoyarsk",   name: "Krasnoyarsk", native: "Красноярск",     country: "RU", lat: 56.01, lng: 92.85  },
  { id: "novosibirsk",   name: "Novosibirsk", native: "Новосибирск",     country: "RU", lat: 55.04, lng: 82.93  },
  { id: "omsk",          name: "Omsk", native: "Омск",            country: "RU", lat: 54.99, lng: 73.37  },
  { id: "yekaterinburg", name: "Yekaterinburg", native: "Екатеринбург",   country: "RU", lat: 56.84, lng: 60.61  },
  { id: "moscow",        name: "Moscow", native: "Москва",          country: "RU", lat: 55.75, lng: 37.62  },
  { id: "chita",         name: "Chita", native: "Чита",           country: "RU", lat: 52.03, lng: 113.52 },
  { id: "zabaikalsk",    name: "Zabaikalsk", native: "Забайкальск",      country: "RU", lat: 49.65, lng: 117.34 },
  { id: "khabarovsk",    name: "Khabarovsk", native: "Хабаровск",      country: "RU", lat: 48.48, lng: 135.08 },
  { id: "vladivostok",   name: "Vladivostok", native: "Владивосток",     country: "RU", lat: 43.12, lng: 131.89 },

  // ==========  NORTH KOREA  ==========
  { id: "sinuiju",       name: "Sinuiju", native: "신의주",         country: "KP", lat: 40.10, lng: 124.39 },
  { id: "pyongyang",     name: "Pyongyang", native: "평양",       country: "KP", lat: 39.02, lng: 125.75 },

  // ==========  SOUTH KOREA  ==========
  { id: "seoul",         name: "Seoul", native: "서울",           country: "KR", lat: 37.55, lng: 126.97 },
  { id: "suwon",         name: "Suwon", native: "수원",           country: "KR", lat: 37.27, lng: 127.00 },
  { id: "daejeon",       name: "Daejeon", native: "대전",         country: "KR", lat: 36.33, lng: 127.42 },
  { id: "daegu",         name: "Daegu", native: "대구",           country: "KR", lat: 35.87, lng: 128.60 },
  { id: "busan",         name: "Busan", native: "부산",           country: "KR", lat: 35.18, lng: 129.06 },
  { id: "gwangju",       name: "Gwangju", native: "광주",         country: "KR", lat: 35.16, lng: 126.85 },
  { id: "mokpo",         name: "Mokpo", native: "목포",           country: "KR", lat: 34.79, lng: 126.39 },

  // ==========  JAPAN  ==========
  { id: "tokyo",         name: "Tokyo", native: "東京",           country: "JP", lat: 35.68, lng: 139.77 },
  { id: "yokohama",      name: "Yokohama", native: "横浜",        country: "JP", lat: 35.47, lng: 139.62 },
  { id: "nagoya",        name: "Nagoya", native: "名古屋",          country: "JP", lat: 35.17, lng: 136.88 },
  { id: "kyoto",         name: "Kyoto", native: "京都",           country: "JP", lat: 35.01, lng: 135.76 },
  { id: "shin_osaka",    name: "Osaka", native: "新大阪",           country: "JP", lat: 34.73, lng: 135.50 },
  { id: "shin_kobe",     name: "Kobe", native: "新神戸",            country: "JP", lat: 34.71, lng: 135.20 },
  { id: "okayama",       name: "Okayama", native: "岡山",         country: "JP", lat: 34.66, lng: 133.92 },
  { id: "hiroshima",     name: "Hiroshima", native: "広島",       country: "JP", lat: 34.40, lng: 132.46 },
  { id: "hakata",        name: "Fukuoka (Hakata)", native: "博多", country: "JP", lat: 33.59, lng: 130.42 },
  { id: "kagoshima",     name: "Kagoshima", native: "鹿児島",       country: "JP", lat: 31.58, lng: 130.55 },
  { id: "kanazawa",      name: "Kanazawa", native: "金沢",        country: "JP", lat: 36.58, lng: 136.65 },
  { id: "niigata",       name: "Niigata", native: "新潟",         country: "JP", lat: 37.91, lng: 139.06 },
  { id: "sendai",        name: "Sendai", native: "仙台",          country: "JP", lat: 38.26, lng: 140.88 },
  { id: "morioka",       name: "Morioka", native: "盛岡",         country: "JP", lat: 39.70, lng: 141.15 },
  { id: "aomori",        name: "Aomori", native: "青森",          country: "JP", lat: 40.83, lng: 140.74 },
  { id: "hakodate",      name: "Hakodate", native: "函館",        country: "JP", lat: 41.91, lng: 140.65 },
  { id: "sapporo",       name: "Sapporo", native: "札幌",         country: "JP", lat: 43.07, lng: 141.35 },

  // ==========  VIETNAM / LAOS / CAMBODIA  ==========
  { id: "hanoi",         name: "Hanoi", native: "Hà Nội",           country: "VN", lat: 21.03, lng: 105.85 },
  { id: "haiphong",      name: "Hải Phòng", native: "Hải Phòng",       country: "VN", lat: 20.86, lng: 106.68 },
  { id: "dongdang",      name: "Đồng Đăng", native: "Đồng Đăng",       country: "VN", lat: 21.85, lng: 106.70 },
  { id: "laocai",        name: "Lào Cai", native: "Lào Cai",         country: "VN", lat: 22.49, lng: 103.96 },
  { id: "vinh",          name: "Vinh", native: "Vinh",            country: "VN", lat: 18.68, lng: 105.69 },
  { id: "hue",           name: "Huế", native: "Huế",             country: "VN", lat: 16.46, lng: 107.59 },
  { id: "danang",        name: "Da Nang", native: "Đà Nẵng",         country: "VN", lat: 16.06, lng: 108.21 },
  { id: "nhatrang",      name: "Nha Trang", native: "Nha Trang",       country: "VN", lat: 12.24, lng: 109.19 },
  { id: "hcmc",          name: "Hồ Chí Minh", native: "Thành phố Hồ Chí Minh",     country: "VN", lat: 10.78, lng: 106.70 },
  { id: "boten",         name: "Boten", native: "ບໍ່ແຕນ",           country: "LA", lat: 21.21, lng: 101.79 },
  { id: "luangprabang",  name: "Luang Prabang", native: "ຫຼວງພະບາງ",   country: "LA", lat: 19.89, lng: 102.13 },
  { id: "vangvieng",     name: "Vang Vieng", native: "ວັງວຽງ",      country: "LA", lat: 18.92, lng: 102.45 },
  { id: "vientiane",     name: "Vientiane", native: "ວຽງຈັນ",       country: "LA", lat: 17.96, lng: 102.61 },
  { id: "poipet",        name: "Poipet", native: "ប៉ោយប៉ែត",          country: "KH", lat: 13.66, lng: 102.57 },
  { id: "sisophon",      name: "Sisophon", native: "សិរីសោភ័ណ",        country: "KH", lat: 13.59, lng: 102.97 },
  { id: "phnompenh",     name: "Phnom Penh", native: "ភ្នំពេញ",      country: "KH", lat: 11.56, lng: 104.92 },
  { id: "kampot",        name: "Kampot", native: "កំពត",              country: "KH", lat: 10.62, lng: 104.18 },
  { id: "sihanoukville", name: "Sihanoukville", native: "ក្រុងព្រះសីហនុ",   country: "KH", lat: 10.61, lng: 103.53 },

  // ==========  THAILAND  ==========
  { id: "nongkhai",      name: "Nong Khai", native: "หนองคาย",       country: "TH", lat: 17.88, lng: 102.74 },
  { id: "udonthani",     name: "Udon Thani", native: "อุดรธานี",      country: "TH", lat: 17.41, lng: 102.79 },
  { id: "khonkaen",      name: "Khon Kaen", native: "ขอนแก่น",       country: "TH", lat: 16.44, lng: 102.83 },
  { id: "korat",         name: "Nakhon Ratchasima", native: "นครราชสีมา", country: "TH", lat: 14.97, lng: 102.10 },
  { id: "ayutthaya",     name: "Ayutthaya", native: "อยุธยา",       country: "TH", lat: 14.36, lng: 100.58 },
  { id: "bangkok",       name: "Bangkok", native: "กรุงเทพ",         country: "TH", lat: 13.75, lng: 100.50 },
  { id: "chiangmai",     name: "Chiang Mai", native: "เชียงใหม่",      country: "TH", lat: 18.79, lng: 98.99  },
  { id: "huahin",        name: "Hua Hin", native: "หัวหิน",         country: "TH", lat: 12.57, lng: 99.96  },
  { id: "suratthani",    name: "Surat Thani", native: "สุราษฎร์ธานี",     country: "TH", lat: 9.14,  lng: 99.33  },
  { id: "hatyai",        name: "Hat Yai", native: "หาดใหญ่",         country: "TH", lat: 7.01,  lng: 100.47 },
  { id: "padangbesar",   name: "Padang Besar", native: "ปาดังเบซาร์",    country: "TH", lat: 6.66,  lng: 100.32 },
  { id: "aranya",        name: "Aranyaprathet", native: "อรัญประเทศ",   country: "TH", lat: 13.69, lng: 102.50 },

  // ==========  MALAYSIA + SINGAPORE  ==========
  { id: "butterworth",   name: "Butterworth", native: "Butterworth",     country: "MY", lat: 5.41,  lng: 100.36 },
  { id: "ipoh",          name: "Ipoh", native: "Ipoh",            country: "MY", lat: 4.59,  lng: 101.08 },
  { id: "kualalumpur",   name: "Kuala Lumpur", native: "Kuala Lumpur",    country: "MY", lat: 3.14,  lng: 101.69 },
  { id: "gemas",         name: "Gemas", native: "Gemas",           country: "MY", lat: 2.59,  lng: 102.61 },
  { id: "johorbahru",    name: "Johor Bahru", native: "Johor Bahru",     country: "MY", lat: 1.49,  lng: 103.76 },
  { id: "singapore",     name: "Singapore", native: "新加坡 · Singapura · சிங்கப்பூர்", country: "SG", lat: 1.30,  lng: 103.85 },

  // ==========  MYANMAR  ==========
  { id: "yangon",        name: "Yangon", native: "ရန်ကုန်",          country: "MM", lat: 16.81, lng: 96.16 },
  { id: "naypyidaw",     name: "Naypyidaw", native: "နေပြည်တော်",       country: "MM", lat: 19.74, lng: 96.08 },
  { id: "mandalay",      name: "Mandalay", native: "မန္တလေး",        country: "MM", lat: 21.97, lng: 96.08 },

  // ==========  INDONESIA  ==========
  { id: "jakarta",       name: "Jakarta", native: "Jakarta",         country: "ID", lat: -6.20, lng: 106.85 },
  { id: "bandung",       name: "Bandung", native: "Bandung",         country: "ID", lat: -6.91, lng: 107.60 },
  { id: "yogyakarta",    name: "Yogyakarta", native: "Yogyakarta",      country: "ID", lat: -7.80, lng: 110.36 },
  { id: "surabaya",      name: "Surabaya", native: "Surabaya",        country: "ID", lat: -7.25, lng: 112.74 },

  // ==========  INDIA  ==========
  { id: "delhi",         name: "New Delhi", native: "नई दिल्ली",       country: "IN", lat: 28.64, lng: 77.22 },
  { id: "amritsar",      name: "Amritsar", native: "ਅੰਮ੍ਰਿਤਸਰ",        country: "IN", lat: 31.63, lng: 74.87 },
  { id: "jammu",         name: "Jammu Tawi", native: "जम्मू तवी",      country: "IN", lat: 32.71, lng: 74.86 },
  { id: "jaipur",        name: "Jaipur", native: "जयपुर",          country: "IN", lat: 26.92, lng: 75.79 },
  { id: "ahmedabad",     name: "Ahmedabad", native: "અમદાવાદ",       country: "IN", lat: 23.03, lng: 72.60 },
  { id: "vadodara",      name: "Vadodara", native: "વડોદરા",        country: "IN", lat: 22.31, lng: 73.18 },
  { id: "surat_in",      name: "Surat", native: "સુરત",           country: "IN", lat: 21.17, lng: 72.83 },
  { id: "mumbai",        name: "Mumbai", native: "मुंबई",          country: "IN", lat: 18.94, lng: 72.83 },
  { id: "pune",          name: "Pune", native: "पुणे",            country: "IN", lat: 18.53, lng: 73.87 },
  { id: "kota",          name: "Kota", native: "कोटा",            country: "IN", lat: 25.21, lng: 75.86 },
  { id: "bhopal",        name: "Bhopal", native: "भोपाल",          country: "IN", lat: 23.27, lng: 77.40 },
  { id: "nagpur",        name: "Nagpur", native: "नागपूर",          country: "IN", lat: 21.16, lng: 79.09 },
  { id: "lucknow",       name: "Lucknow", native: "लखनऊ",         country: "IN", lat: 26.84, lng: 80.95 },
  { id: "varanasi",      name: "Varanasi", native: "वाराणसी",        country: "IN", lat: 25.32, lng: 82.99 },
  { id: "patna",         name: "Patna", native: "पटना",           country: "IN", lat: 25.61, lng: 85.14 },
  { id: "howrah",        name: "Kolkata (Howrah)", native: "হাওড়া", country: "IN", lat: 22.58, lng: 88.34 },
  { id: "guwahati",      name: "Guwahati", native: "গুৱাহাটী",        country: "IN", lat: 26.18, lng: 91.74 },
  { id: "bhubaneswar",   name: "Bhubaneswar", native: "ଭୁବନେଶ୍ୱର",     country: "IN", lat: 20.27, lng: 85.84 },
  { id: "vizag",         name: "Visakhapatnam", native: "విశాఖపట్నం",   country: "IN", lat: 17.69, lng: 83.22 },
  { id: "hyderabad_in",  name: "Hyderabad", native: "హైదరాబాద్",       country: "IN", lat: 17.43, lng: 78.50 },
  { id: "vijayawada",    name: "Vijayawada", native: "విజయవాడ",      country: "IN", lat: 16.51, lng: 80.65 },
  { id: "bangalore",     name: "Bengaluru", native: "ಬೆಂಗಳೂರು",       country: "IN", lat: 12.98, lng: 77.57 },
  { id: "chennai",       name: "Chennai", native: "சென்னை",         country: "IN", lat: 13.08, lng: 80.27 },
  { id: "coimbatore",    name: "Coimbatore", native: "கோயம்புத்தூர்",      country: "IN", lat: 11.00, lng: 76.96 },
  { id: "ernakulam",     name: "Kochi", native: "എറണാകുളം",           country: "IN", lat: 9.97,  lng: 76.29 },
  { id: "trivandrum",    name: "Trivandrum", native: "തിരുവനന്തപുരം",      country: "IN", lat: 8.49,  lng: 76.95 },
  { id: "madurai",       name: "Madurai", native: "மதுரை",         country: "IN", lat: 9.93,  lng: 78.12 },
  { id: "darshana",      name: "Gede", native: "গেদে",            country: "IN", lat: 23.55, lng: 88.81 },

  // ==========  BANGLADESH  ==========
  { id: "dhaka",         name: "Dhaka", native: "ঢাকা",           country: "BD", lat: 23.81, lng: 90.41 },
  { id: "chittagong",    name: "Chittagong", native: "চট্টগ্রাম",      country: "BD", lat: 22.36, lng: 91.78 },
  { id: "khulna",        name: "Khulna", native: "খুলনা",          country: "BD", lat: 22.84, lng: 89.54 },
  { id: "rajshahi",      name: "Rajshahi", native: "রাজশাহী",        country: "BD", lat: 24.37, lng: 88.60 },
  { id: "sylhet",        name: "Sylhet", native: "সিলেট",          country: "BD", lat: 24.90, lng: 91.87 },

  // ==========  PAKISTAN  ==========
  { id: "karachi",       name: "Karachi", native: "کراچی",         country: "PK", lat: 24.86, lng: 67.01 },
  { id: "hyderabad_pk",  name: "Hyderabad", native: "حیدرآباد",       country: "PK", lat: 25.40, lng: 68.37 },
  { id: "sukkur",        name: "Sukkur", native: "سکھر",          country: "PK", lat: 27.71, lng: 68.85 },
  { id: "multan",        name: "Multan", native: "ملتان",          country: "PK", lat: 30.16, lng: 71.52 },
  { id: "lahore",        name: "Lahore", native: "لاہور",          country: "PK", lat: 31.55, lng: 74.34 },
  { id: "faisalabad",    name: "Faisalabad", native: "فیصل آباد",      country: "PK", lat: 31.42, lng: 73.08 },
  { id: "rawalpindi",    name: "Rawalpindi", native: "راولپنڈی",      country: "PK", lat: 33.60, lng: 73.05 },
  { id: "peshawar",      name: "Peshawar", native: "پشاور",        country: "PK", lat: 34.01, lng: 71.54 },
  { id: "quetta",        name: "Quetta", native: "کوئٹہ",          country: "PK", lat: 30.18, lng: 66.99 },

  // ==========  SRI LANKA  ==========
  { id: "colombo",       name: "Colombo", native: "කොළඹ",         country: "LK", lat: 6.93,  lng: 79.85 },
  { id: "kandy",         name: "Kandy", native: "මහනුවර",           country: "LK", lat: 7.29,  lng: 80.63 },
  { id: "galle",         name: "Galle", native: "ගාල්ල",           country: "LK", lat: 6.03,  lng: 80.21 },
  { id: "anuradhapura",  name: "Anuradhapura", native: "අනුරාධපුර",    country: "LK", lat: 8.34,  lng: 80.41 },
  { id: "jaffna",        name: "Jaffna", native: "யாழ்ப்பாணம்",          country: "LK", lat: 9.66,  lng: 80.02 },

  // ==========  IRAN  ==========
  { id: "tehran",        name: "Tehran", native: "تهران",          country: "IR", lat: 35.69, lng: 51.39 },
  { id: "qom",           name: "Qom", native: "قم",             country: "IR", lat: 34.64, lng: 50.88 },
  { id: "isfahan",       name: "Isfahan", native: "اصفهان",         country: "IR", lat: 32.65, lng: 51.66 },
  { id: "shiraz",        name: "Shiraz", native: "شیراز",          country: "IR", lat: 29.59, lng: 52.58 },
  { id: "mashhad",       name: "Mashhad", native: "مشهد",         country: "IR", lat: 36.30, lng: 59.61 },
  { id: "tabriz",        name: "Tabriz", native: "تبریز",          country: "IR", lat: 38.08, lng: 46.30 },
  { id: "ahvaz",         name: "Ahvaz", native: "اهواز",           country: "IR", lat: 31.32, lng: 48.69 },
  { id: "bandarabbas",   name: "Bandar Abbas", native: "بندرعباس",    country: "IR", lat: 27.18, lng: 56.28 },
  { id: "sarakhs",       name: "Sarakhs", native: "سرخس",         country: "IR", lat: 36.55, lng: 61.16 },
  { id: "razi",          name: "Razi", native: "رازی",            country: "IR", lat: 39.04, lng: 44.06 },

  // ==========  TURKEY  ==========
  { id: "istanbul",      name: "Istanbul", native: "İstanbul",        country: "TR", lat: 41.04, lng: 28.78 },
  { id: "eskisehir",     name: "Eskişehir", native: "Eskişehir",       country: "TR", lat: 39.78, lng: 30.51 },
  { id: "ankara",        name: "Ankara", native: "Ankara",          country: "TR", lat: 39.95, lng: 32.85 },
  { id: "konya",         name: "Konya", native: "Konya",           country: "TR", lat: 37.87, lng: 32.49 },
  { id: "sivas",         name: "Sivas", native: "Sivas",           country: "TR", lat: 39.75, lng: 37.02 },
  { id: "izmir",         name: "İzmir", native: "İzmir",           country: "TR", lat: 38.42, lng: 27.14 },
  { id: "gaziantep",     name: "Gaziantep", native: "Gaziantep",       country: "TR", lat: 37.07, lng: 37.38 },
  { id: "malatya",       name: "Malatya", native: "Malatya",          country: "TR", lat: 38.36, lng: 38.31 },
  { id: "diyarbakir",    name: "Diyarbakır", native: "Diyarbakır",     country: "TR", lat: 37.92, lng: 40.22 },
  { id: "van",           name: "Van", native: "Van",             country: "TR", lat: 38.49, lng: 43.40 },
  { id: "kars",          name: "Kars", native: "Kars",            country: "TR", lat: 40.61, lng: 43.10 },

  // ==========  CAUCASUS  ==========
  { id: "tbilisi",       name: "Tbilisi", native: "თბილისი",         country: "GE", lat: 41.72, lng: 44.78 },
  { id: "gori",          name: "Gori", native: "გორი",                country: "GE", lat: 41.98, lng: 44.11 },
  { id: "khashuri",      name: "Khashuri", native: "ხაშური",          country: "GE", lat: 41.99, lng: 43.60 },
  { id: "kutaisi",       name: "Kutaisi", native: "ქუთაისი",         country: "GE", lat: 42.27, lng: 42.71 },
  { id: "poti",          name: "Poti", native: "ფოთი",                country: "GE", lat: 42.15, lng: 41.67 },
  { id: "zugdidi",       name: "Zugdidi", native: "ზუგდიდი",          country: "GE", lat: 42.51, lng: 41.87 },
  { id: "batumi",        name: "Batumi", native: "ბათუმი",          country: "GE", lat: 41.65, lng: 41.64 },
  { id: "yerevan",       name: "Yerevan", native: "Երևան",         country: "AM", lat: 40.18, lng: 44.51 },
  { id: "vanadzor",      name: "Vanadzor", native: "Վանաձոր",       country: "AM", lat: 40.81, lng: 44.49 },
  { id: "baku",          name: "Baku", native: "Bakı",            country: "AZ", lat: 40.41, lng: 49.87 },
  { id: "sumgait",       name: "Sumqayıt", native: "Sumqayıt",       country: "AZ", lat: 40.59, lng: 49.67 },
  { id: "yevlakh",       name: "Yevlakh", native: "Yevlax",         country: "AZ", lat: 40.62, lng: 47.15 },
  { id: "ganja",         name: "Ganja", native: "Gəncə",           country: "AZ", lat: 40.68, lng: 46.36 },
  { id: "agstafa",       name: "Ağstafa", native: "Ağstafa",         country: "AZ", lat: 41.12, lng: 45.46 },

  // ==========  CENTRAL ASIA  ==========
  { id: "almaty",        name: "Almaty", native: "Алматы",          country: "KZ", lat: 43.22, lng: 76.85 },
  { id: "astana",        name: "Astana", native: "Астана",          country: "KZ", lat: 51.13, lng: 71.43 },
  { id: "shymkent",      name: "Shymkent", native: "Шымкент",        country: "KZ", lat: 42.32, lng: 69.59 },
  { id: "aktobe",        name: "Aktobe", native: "Ақтөбе",          country: "KZ", lat: 50.30, lng: 57.17 },
  { id: "atyrau",        name: "Atyrau", native: "Атырау",          country: "KZ", lat: 47.10, lng: 51.92 },
  { id: "aktau",         name: "Aktau", native: "Ақтау",           country: "KZ", lat: 43.65, lng: 51.16 },
  { id: "dostyk",        name: "Dostyk", native: "Достық",          country: "KZ", lat: 45.25, lng: 82.55 },
  { id: "tashkent",      name: "Tashkent", native: "Toshkent",        country: "UZ", lat: 41.30, lng: 69.27 },
  { id: "samarkand",     name: "Samarkand", native: "Samarqand",       country: "UZ", lat: 39.65, lng: 66.97 },
  { id: "bukhara",       name: "Bukhara", native: "Buxoro",         country: "UZ", lat: 39.77, lng: 64.42 },
  { id: "khiva",         name: "Khiva (Urgench)", native: "Xiva", country: "UZ", lat: 41.55, lng: 60.63 },
  { id: "andijan",       name: "Andijan", native: "Andijon",         country: "UZ", lat: 40.78, lng: 72.34 },
  { id: "termez",        name: "Termez", native: "Termiz",           country: "UZ", lat: 37.22, lng: 67.28 },
  { id: "nukus",         name: "Nukus", native: "Nukus",            country: "UZ", lat: 42.46, lng: 59.61 },
  { id: "ashgabat",      name: "Ashgabat", native: "Aşgabat",        country: "TM", lat: 37.95, lng: 58.38 },
  { id: "mary",          name: "Mary", native: "Mary",            country: "TM", lat: 37.60, lng: 61.84 },
  { id: "turkmenabat",   name: "Türkmenabat", native: "Türkmenabat",  country: "TM", lat: 39.07, lng: 63.58 },
  { id: "turkmenbashi",  name: "Türkmenbaşı", native: "Türkmenbaşy",     country: "TM", lat: 40.02, lng: 52.97 },
  { id: "dushanbe",      name: "Dushanbe", native: "Душанбе",        country: "TJ", lat: 38.56, lng: 68.79 },
  { id: "bishkek",       name: "Bishkek", native: "Бишкек",          country: "KG", lat: 42.87, lng: 74.59 },
  { id: "balykchy",      name: "Balykchy", native: "Балыкчы",         country: "KG", lat: 42.46, lng: 76.18 },

  // ==========  IRAQ  ==========
  // IRR runs Baghdad–Basra overnight sleeper on alternate days; Mosul
  // service was reactivated post-ISIS but remains intermittent.
  { id: "baghdad",       name: "Baghdad", native: "بغداد",            country: "IQ", lat: 33.31, lng: 44.36 },
  { id: "basra",         name: "Basra", native: "البصرة",             country: "IQ", lat: 30.51, lng: 47.78 },
  { id: "mosul",         name: "Mosul", native: "الموصل",            country: "IQ", lat: 36.34, lng: 43.13 },

  // ==========  UAE — Etihad Rail (Hafeet Express, launched 2024–25)  ==========
  { id: "abudhabi",      name: "Abu Dhabi", native: "أبوظبي",          country: "AE", lat: 24.47, lng: 54.37 },
  { id: "dubai",         name: "Dubai", native: "دبي",                country: "AE", lat: 25.20, lng: 55.27 },
  { id: "sharjah",       name: "Sharjah", native: "الشارقة",           country: "AE", lat: 25.35, lng: 55.42 },
  { id: "fujairah",      name: "Fujairah", native: "الفجيرة",          country: "AE", lat: 25.13, lng: 56.34 },

  // ==========  ISRAEL  ==========
  { id: "telaviv",       name: "Tel Aviv", native: "תל אביב",        country: "IL", lat: 32.08, lng: 34.78 },
  { id: "jerusalem",     name: "Jerusalem", native: "ירושלים",       country: "IL", lat: 31.79, lng: 35.20 },
  { id: "haifa",         name: "Haifa", native: "חיפה",           country: "IL", lat: 32.79, lng: 34.99 },
  { id: "beersheba",     name: "Beersheba", native: "באר שבע",       country: "IL", lat: 31.25, lng: 34.79 },

  // ==========  SAUDI ARABIA  ==========
  { id: "riyadh",        name: "Riyadh", native: "الرياض",          country: "SA", lat: 24.71, lng: 46.68 },
  { id: "jeddah",        name: "Jeddah", native: "جدة",          country: "SA", lat: 21.49, lng: 39.21 },
  { id: "mecca",         name: "Mecca", native: "مكة",           country: "SA", lat: 21.43, lng: 39.83 },
  { id: "medina",        name: "Medina", native: "المدينة المنورة",          country: "SA", lat: 24.47, lng: 39.61 },
  { id: "dammam",        name: "Dammam", native: "الدمام",          country: "SA", lat: 26.43, lng: 50.10 },
  { id: "hofuf",         name: "Hofuf", native: "الهفوف",           country: "SA", lat: 25.36, lng: 49.59 },

  // ==========  TAIWAN — THSR + TRA  ==========
  { id: "taipei",        name: "Taipei", native: "臺北", country: "TW", lat: 25.05, lng: 121.52 },
  { id: "banqiao",       name: "Banqiao", native: "板橋", country: "TW", lat: 25.01, lng: 121.46 },
  { id: "taoyuan_tw",    name: "Taoyuan HSR", native: "桃園", country: "TW", lat: 25.01, lng: 121.21 },
  { id: "hsinchu",       name: "Hsinchu HSR", native: "新竹", country: "TW", lat: 24.81, lng: 121.04 },
  { id: "taichung",      name: "Taichung", native: "臺中", country: "TW", lat: 24.11, lng: 120.62 },
  { id: "chiayi",        name: "Chiayi HSR", native: "嘉義", country: "TW", lat: 23.46, lng: 120.32 },
  { id: "tainan",        name: "Tainan HSR", native: "臺南", country: "TW", lat: 22.92, lng: 120.29 },
  { id: "kaohsiung",     name: "Kaohsiung", native: "高雄", country: "TW", lat: 22.69, lng: 120.31 },
  { id: "hualien",       name: "Hualien", native: "花蓮", country: "TW", lat: 23.99, lng: 121.60 },
  { id: "taitung",       name: "Taitung", native: "臺東", country: "TW", lat: 22.79, lng: 121.10 },

  // ==========  NORTH KOREA additions  ==========
  { id: "kaesong",       name: "Kaesong", native: "개성",         country: "KP", lat: 37.98, lng: 126.55 },
  { id: "wonsan",        name: "Wonsan", native: "원산",          country: "KP", lat: 39.15, lng: 127.45 },

  // ==========  JAPAN intermediates (Tokaido / San'yo)  ==========
  { id: "shizuoka",      name: "Shizuoka", native: "静岡",        country: "JP", lat: 34.97, lng: 138.39 },
  { id: "hamamatsu",     name: "Hamamatsu", native: "浜松",       country: "JP", lat: 34.71, lng: 137.73 },
  { id: "himeji",        name: "Himeji", native: "姫路",          country: "JP", lat: 34.83, lng: 134.69 },
  { id: "fukuyama",      name: "Fukuyama", native: "福山",        country: "JP", lat: 34.49, lng: 133.36 },

  // ==========  SOUTH KOREA intermediates  ==========
  { id: "cheonan_asan",  name: "Cheonan-Asan", native: "천안아산",    country: "KR", lat: 36.79, lng: 127.10 },
  { id: "pohang",        name: "Pohang", native: "포항",          country: "KR", lat: 36.04, lng: 129.36 },

  // ==========  CHINA — Beijing–Harbin intermediates  ==========
  { id: "qinhuangdao",   name: "Qinhuangdao",     native: "秦皇岛", country: "CN", lat: 39.94, lng: 119.59 },
  { id: "jinzhou",       name: "Jinzhou",         native: "锦州",   country: "CN", lat: 41.10, lng: 121.13 },
  { id: "siping",        name: "Siping",          native: "四平",   country: "CN", lat: 43.16, lng: 124.35 },
  { id: "tieling",       name: "Tieling",         native: "铁岭",   country: "CN", lat: 42.30, lng: 123.84 },
  { id: "yueyang",       name: "Yueyang",         native: "岳阳",   country: "CN", lat: 29.37, lng: 113.13 },

  // ==========  INDIA intermediates  ==========
  { id: "mathura",       name: "Mathura", native: "मथुरा",         country: "IN", lat: 27.49, lng: 77.67 },
  { id: "prayagraj",     name: "Prayagraj", native: "प्रयागराज",       country: "IN", lat: 25.45, lng: 81.85 },
  { id: "ddu",           name: "Pt. D.D. Upadhyaya", native: "पं. दीन दयाल उपाध्याय", country: "IN", lat: 25.28, lng: 83.12 },
  { id: "aligarh",       name: "Aligarh", native: "अलीगढ़",         country: "IN", lat: 27.88, lng: 78.07 },

  // ==========  RUSSIA — Trans-Siberian intermediates  ==========
  { id: "tayshet",       name: "Tayshet", native: "Тайшет",         country: "RU", lat: 55.94, lng: 98.00 },
  { id: "tyumen",        name: "Tyumen", native: "Тюмень",          country: "RU", lat: 57.15, lng: 65.53 },
  { id: "perm",          name: "Perm", native: "Пермь",            country: "RU", lat: 58.01, lng: 56.25 },
  { id: "kirov",         name: "Kirov", native: "Киров",           country: "RU", lat: 58.60, lng: 49.65 },
  { id: "nnovgorod",     name: "Nizhny Novgorod", native: "Нижний Новгород", country: "RU", lat: 56.32, lng: 44.00 },

  // ==========  VIETNAM Reunification intermediates  ==========
  { id: "thanhhoa",      name: "Thanh Hoá", native: "Thanh Hoá",       country: "VN", lat: 19.81, lng: 105.78 },
  { id: "donghoi",       name: "Đồng Hới", native: "Đồng Hới",        country: "VN", lat: 17.49, lng: 106.62 },
  { id: "quangngai",     name: "Quảng Ngãi", native: "Quảng Ngãi",      country: "VN", lat: 15.12, lng: 108.79 },
  { id: "tuyhoa",        name: "Tuy Hòa", native: "Tuy Hòa",         country: "VN", lat: 13.10, lng: 109.32 },
  { id: "phanthiet",     name: "Phan Thiết", native: "Phan Thiết",      country: "VN", lat: 10.93, lng: 108.10 },

  // ==========  THAILAND intermediates  ==========
  { id: "phitsanulok",   name: "Phitsanulok", native: "พิษณุโลก",     country: "TH", lat: 16.83, lng: 100.27 },
  { id: "lampang",       name: "Lampang", native: "ลำปาง",         country: "TH", lat: 18.29, lng: 99.50  },

  // ==========  INDONESIA intermediates  ==========
  { id: "cirebon",       name: "Cirebon", native: "Cirebon",         country: "ID", lat: -6.71, lng: 108.55 },
  { id: "semarang",      name: "Semarang", native: "Semarang",        country: "ID", lat: -6.97, lng: 110.42 },

  // ==========  PAKISTAN intermediates  ==========
  { id: "bahawalpur",    name: "Bahawalpur", native: "بہاولپور",      country: "PK", lat: 29.40, lng: 71.68 },
  { id: "sahiwal",       name: "Sahiwal", native: "ساہیوال",         country: "PK", lat: 30.66, lng: 73.10 },

  // ==========  BANGLADESH intermediates  ==========
  { id: "comilla",       name: "Comilla", native: "কুমিল্লা",         country: "BD", lat: 23.46, lng: 91.18 },

  // ==========  IRAN intermediates  ==========
  { id: "kerman",        name: "Kerman", native: "کرمان",          country: "IR", lat: 30.28, lng: 57.08 },
  { id: "yazd",          name: "Yazd", native: "یزد",            country: "IR", lat: 31.90, lng: 54.37 },

  // ==========  v0.5 station additions  ==========
  // China — Yunnan-Vietnam Railway + sleeper junctions + Hainan
  { id: "hekou_cn",      name: "Hekou North",     native: "河口北",   country: "CN", lat: 22.59, lng: 103.94 },
  { id: "jiujiang",      name: "Jiujiang",        native: "九江",     country: "CN", lat: 29.71, lng: 116.00 },
  { id: "yichang",       name: "Yichang",         native: "宜昌",     country: "CN", lat: 30.69, lng: 111.29 },
  { id: "wenzhou",       name: "Wenzhou",         native: "温州",     country: "CN", lat: 27.99, lng: 120.65 },
  { id: "ningbo",        name: "Ningbo",          native: "宁波",     country: "CN", lat: 29.86, lng: 121.62 },
  { id: "haikou",        name: "Haikou",          native: "海口",     country: "CN", lat: 20.04, lng: 110.32 },
  { id: "sanya",         name: "Sanya",           native: "三亚",     country: "CN", lat: 18.25, lng: 109.51 },
  { id: "zhanjiang",     name: "Zhanjiang",       native: "湛江",     country: "CN", lat: 21.27, lng: 110.36 },
  { id: "tongren",       name: "Tongren",         native: "铜仁",     country: "CN", lat: 27.72, lng: 109.18 },
  { id: "huaihua",       name: "Huaihua",         native: "怀化",     country: "CN", lat: 27.55, lng: 109.96 },
  // India — more trunk-route nodes
  { id: "kanpur",        name: "Kanpur", native: "कानपुर",          country: "IN", lat: 26.45, lng: 80.33 },
  { id: "agra",          name: "Agra Cantt", native: "आगरा",      country: "IN", lat: 27.15, lng: 78.00 },
  { id: "gwalior",       name: "Gwalior", native: "ग्वालियर",         country: "IN", lat: 26.21, lng: 78.18 },
  { id: "jhansi",        name: "Jhansi", native: "झाँसी",          country: "IN", lat: 25.45, lng: 78.58 },
  { id: "itarsi",        name: "Itarsi", native: "इटारसी",          country: "IN", lat: 22.62, lng: 77.76 },
  { id: "secunderabad",  name: "Secunderabad", native: "సికింద్రాబాద్",    country: "IN", lat: 17.50, lng: 78.55 },
  { id: "katpadi",       name: "Katpadi", native: "காட்பாடி",         country: "IN", lat: 12.97, lng: 79.13 },
  { id: "tiruchirapalli",name: "Tiruchirapalli", native: "திருச்சிராப்பள்ளி",  country: "IN", lat: 10.79, lng: 78.69 },
  // Russia — Black Sea / Volga corridors
  { id: "kazan",         name: "Kazan", native: "Казань",           country: "RU", lat: 55.79, lng: 49.12 },
  { id: "samara",        name: "Samara", native: "Самара",          country: "RU", lat: 53.20, lng: 50.15 },
  { id: "ufa",           name: "Ufa", native: "Уфа",             country: "RU", lat: 54.74, lng: 55.97 },
  // Türkiye — Adana + Mersin
  { id: "adana",         name: "Adana", native: "Adana",           country: "TR", lat: 37.00, lng: 35.32 },
  { id: "mersin",        name: "Mersin", native: "Mersin",          country: "TR", lat: 36.81, lng: 34.64 },
  // Kazakhstan + Uzbekistan extras
  { id: "kyzylorda",     name: "Kyzylorda", native: "Қызылорда",       country: "KZ", lat: 44.85, lng: 65.51 },
  { id: "petropavl",     name: "Petropavl", native: "Петропавл",       country: "KZ", lat: 54.87, lng: 69.15 },

  // ==========  v0.6 additions  ==========
  // RUSSIA — European core + south + Volga + Far East branches
  { id: "stpetersburg",  name: "St. Petersburg", native: "Санкт-Петербург",  country: "RU", lat: 59.93, lng: 30.34 },
  { id: "tula",          name: "Tula", native: "Тула",            country: "RU", lat: 54.20, lng: 37.62 },
  { id: "kursk",         name: "Kursk", native: "Курск",           country: "RU", lat: 51.74, lng: 36.18 },
  { id: "belgorod",      name: "Belgorod", native: "Белгород",        country: "RU", lat: 50.60, lng: 36.59 },
  { id: "bryansk",       name: "Bryansk", native: "Брянск",         country: "RU", lat: 53.24, lng: 34.36 },
  { id: "smolensk",      name: "Smolensk", native: "Смоленск",        country: "RU", lat: 54.78, lng: 32.05 },
  { id: "voronezh",      name: "Voronezh", native: "Воронеж",        country: "RU", lat: 51.66, lng: 39.20 },
  { id: "rostov_don",    name: "Rostov-on-Don", native: "Ростов-на-Дону",   country: "RU", lat: 47.22, lng: 39.71 },
  { id: "krasnodar",     name: "Krasnodar", native: "Краснодар",       country: "RU", lat: 45.03, lng: 38.98 },
  { id: "sochi",         name: "Sochi (Adler)", native: "Сочи",   country: "RU", lat: 43.43, lng: 39.93 },
  { id: "volgograd",     name: "Volgograd", native: "Волгоград",       country: "RU", lat: 48.71, lng: 44.51 },
  { id: "astrakhan",     name: "Astrakhan", native: "Астрахань",       country: "RU", lat: 46.35, lng: 48.04 },
  { id: "saratov",       name: "Saratov", native: "Саратов",         country: "RU", lat: 51.53, lng: 46.04 },
  { id: "penza",         name: "Penza", native: "Пенза",           country: "RU", lat: 53.20, lng: 45.00 },
  { id: "ulyanovsk",     name: "Ulyanovsk", native: "Ульяновск",       country: "RU", lat: 54.32, lng: 48.40 },
  { id: "vladimir_ru",   name: "Vladimir", native: "Владимир",        country: "RU", lat: 56.13, lng: 40.40 },
  { id: "yaroslavl",     name: "Yaroslavl", native: "Ярославль",       country: "RU", lat: 57.62, lng: 39.89 },
  { id: "vologda",       name: "Vologda", native: "Вологда",         country: "RU", lat: 59.22, lng: 39.89 },
  { id: "tomsk",         name: "Tomsk", native: "Томск",           country: "RU", lat: 56.50, lng: 84.97 },
  { id: "barnaul",       name: "Barnaul", native: "Барнаул",         country: "RU", lat: 53.35, lng: 83.78 },
  { id: "komsomolsk",    name: "Komsomolsk-na-Amure", native: "Комсомольск-на-Амуре", country: "RU", lat: 50.55, lng: 137.01 },
  { id: "sov_gavan",     name: "Sovetskaya Gavan", native: "Советская Гавань", country: "RU", lat: 49.00, lng: 140.27 },
  { id: "nakhodka",      name: "Nakhodka", native: "Находка",        country: "RU", lat: 42.81, lng: 132.87 },

  // CHINA — more HSR intermediates the user keeps flagging
  { id: "changzhou",     name: "Changzhou",       native: "常州",     country: "CN", lat: 31.78, lng: 119.97 },
  { id: "zhenjiang",     name: "Zhenjiang",       native: "镇江",     country: "CN", lat: 32.20, lng: 119.43 },
  { id: "tangshan",      name: "Tangshan",        native: "唐山",     country: "CN", lat: 39.63, lng: 118.18 },
  { id: "luoyang",       name: "Luoyang",         native: "洛阳",     country: "CN", lat: 34.62, lng: 112.45 },
  { id: "kaifeng",       name: "Kaifeng",         native: "开封",     country: "CN", lat: 34.80, lng: 114.31 },
  { id: "shaoxing",      name: "Shaoxing",        native: "绍兴",     country: "CN", lat: 30.04, lng: 120.55 },
  { id: "wuxi_east",     name: "Yichun",          native: "宜春",     country: "CN", lat: 27.81, lng: 114.39 },
  { id: "yancheng",      name: "Yancheng",        native: "盐城",     country: "CN", lat: 33.36, lng: 120.16 },
  { id: "nantong",       name: "Nantong",         native: "南通",     country: "CN", lat: 31.98, lng: 120.86 },
  { id: "ganzhou",       name: "Ganzhou",         native: "赣州",     country: "CN", lat: 25.83, lng: 114.94 },
  { id: "jingdezhen",    name: "Jingdezhen",      native: "景德镇",   country: "CN", lat: 29.27, lng: 117.21 },

  // INDIA — more trunk intermediates
  { id: "ghaziabad",     name: "Ghaziabad", native: "ग़ाज़ियाबाद",       country: "IN", lat: 28.67, lng: 77.42 },
  { id: "tundla",        name: "Tundla", native: "टूँडला",          country: "IN", lat: 27.21, lng: 78.24 },
  { id: "etawah",        name: "Etawah", native: "इटावा",          country: "IN", lat: 26.78, lng: 79.02 },
  { id: "kharagpur",     name: "Kharagpur", native: "খড়্গপুর",       country: "IN", lat: 22.34, lng: 87.32 },

  // VIETNAM — intermediate
  { id: "ninhbinh",      name: "Ninh Bình", native: "Ninh Bình",       country: "VN", lat: 20.25, lng: 105.97 },

  // ==========  v0.8 additions  ==========
  // MALAYSIA — Sabah State Railway (Borneo)
  { id: "kotakinabalu",  name: "Kota Kinabalu", native: "Kota Kinabalu",   country: "MY", lat: 5.98,  lng: 116.07 },
  { id: "beaufort_my",   name: "Beaufort", native: "Beaufort",        country: "MY", lat: 5.34,  lng: 115.74 },
  { id: "tenom",         name: "Tenom", native: "Tenom",           country: "MY", lat: 5.13,  lng: 115.95 },
  // INDONESIA — Sumatra rail islands
  { id: "medan",         name: "Medan", native: "Medan",           country: "ID", lat: 3.59,  lng: 98.67 },
  { id: "tebingtinggi",  name: "Tebing Tinggi", native: "Tebing Tinggi",   country: "ID", lat: 3.33,  lng: 99.16 },
  { id: "siantar",       name: "Pematangsiantar", native: "Pematangsiantar", country: "ID", lat: 2.96,  lng: 99.06 },
  { id: "padang",        name: "Padang", native: "Padang",          country: "ID", lat: -0.95, lng: 100.35 },
  { id: "palembang",     name: "Palembang", native: "Palembang",       country: "ID", lat: -2.98, lng: 104.76 },
  { id: "lampung",       name: "Bandar Lampung", native: "Bandar Lampung",  country: "ID", lat: -5.45, lng: 105.27 },
  // NORTH KOREA — east coast P'yŏngra + Hamgyong lines
  { id: "hamhung",       name: "Hamhung", native: "함흥",         country: "KP", lat: 39.94, lng: 127.54 },
  { id: "chongjin",      name: "Chongjin", native: "청진",        country: "KP", lat: 41.79, lng: 129.78 },
  { id: "rason",         name: "Rason", native: "라선",           country: "KP", lat: 42.25, lng: 130.30 },
  // RUSSIA — Khasan border to NK + Omsk-Petropavl link
  { id: "khasan",        name: "Khasan", native: "Хасан",          country: "RU", lat: 42.43, lng: 130.65 },

  // ==========  v0.9 missing-data sweep  ==========
  // RUSSIA — BAM interior + Caucasus link
  { id: "tynda",         name: "Tynda", native: "Тында",           country: "RU", lat: 55.16, lng: 124.72 },
  { id: "severobaikalsk",name: "Severobaikalsk", native: "Северобайкальск",  country: "RU", lat: 55.65, lng: 109.32 },
  { id: "bratsk",        name: "Bratsk", native: "Братск",          country: "RU", lat: 56.13, lng: 101.61 },
  { id: "makhachkala",   name: "Makhachkala", native: "Махачкала",     country: "RU", lat: 42.98, lng: 47.50 },
  // CHINA — Xinjiang south branch + Northeast extras
  { id: "kashgar",       name: "Kashgar",         native: "喀什",     country: "CN", lat: 39.47, lng: 75.99 },
  { id: "aksu",          name: "Aksu",            native: "阿克苏",   country: "CN", lat: 41.17, lng: 80.26 },
  { id: "korla",         name: "Korla",           native: "库尔勒",   country: "CN", lat: 41.76, lng: 86.15 },
  { id: "hotan",         name: "Hotan",           native: "和田",     country: "CN", lat: 37.10, lng: 79.93 },
  { id: "qiqihar",       name: "Qiqihar",         native: "齐齐哈尔", country: "CN", lat: 47.36, lng: 123.94 },
  { id: "mudanjiang",    name: "Mudanjiang",      native: "牡丹江",   country: "CN", lat: 44.59, lng: 129.62 },
  { id: "yanji",         name: "Yanji",           native: "延吉",     country: "CN", lat: 42.89, lng: 129.51 },
  // IRAN — Tehran western corridor
  { id: "hamadan",       name: "Hamadan", native: "همدان",         country: "IR", lat: 34.80, lng: 48.51 },
  { id: "kermanshah",    name: "Kermanshah", native: "کرمانشاه",      country: "IR", lat: 34.31, lng: 47.07 },
  // SRI LANKA — Hill Country + east
  { id: "badulla",       name: "Badulla", native: "බදුල්ල",         country: "LK", lat: 6.99,  lng: 81.06 },
  { id: "trinco",        name: "Trincomalee", native: "திருகோணமலை",     country: "LK", lat: 8.59,  lng: 81.21 },
  // NEPAL — Janakpur–Jaynagar (new 2023 cross-border)
  { id: "janakpur",      name: "Janakpur", native: "जनकपुर",        country: "NP", lat: 26.73, lng: 85.93 },
  { id: "jaynagar",      name: "Jaynagar", native: "जयनगर",        country: "IN", lat: 26.59, lng: 86.13 },
  // JAPAN — more Shinkansen intermediates
  { id: "maibara",       name: "Maibara", native: "米原",         country: "JP", lat: 35.32, lng: 136.28 },
  { id: "utsunomiya",    name: "Utsunomiya", native: "宇都宮",      country: "JP", lat: 36.55, lng: 139.88 },
  { id: "toyama",        name: "Toyama", native: "富山",          country: "JP", lat: 36.70, lng: 137.21 },
  { id: "fukushima_jp",  name: "Fukushima", native: "福島",       country: "JP", lat: 37.76, lng: 140.47 },

  // ==========  v0.10 missing-data sweep  ==========
  // CHINA — Jinan–Qingdao corridor intermediates + Suifenhe gateway
  { id: "zibo",          name: "Zibo",            native: "淄博",     country: "CN", lat: 36.79, lng: 118.07 },
  { id: "weifang",       name: "Weifang",         native: "潍坊",     country: "CN", lat: 36.71, lng: 119.16 },
  { id: "suifenhe",      name: "Suifenhe",        native: "绥芬河",   country: "CN", lat: 44.41, lng: 131.16 },
  // RUSSIA — Sochi coast + Tula-Orel + Trans-Sib eastern
  { id: "orel",          name: "Orel", native: "Орёл",            country: "RU", lat: 52.97, lng: 36.07 },
  { id: "tuapse",        name: "Tuapse", native: "Туапсе",          country: "RU", lat: 44.10, lng: 39.08 },
  // PAKISTAN — Punjab fillers
  { id: "sialkot",       name: "Sialkot", native: "سیالکوٹ",         country: "PK", lat: 32.50, lng: 74.53 },
  { id: "gujranwala",    name: "Gujranwala", native: "گوجرانوالہ",      country: "PK", lat: 32.16, lng: 74.19 },
  // BANGLADESH — Northern + central
  { id: "bogra",         name: "Bogra", native: "বগুড়া",           country: "BD", lat: 24.85, lng: 89.37 },
  { id: "mymensingh",    name: "Mymensingh", native: "ময়মনসিংহ",      country: "BD", lat: 24.75, lng: 90.40 },
  // SRI LANKA — hill country intermediate + east plain
  { id: "hatton",        name: "Hatton", native: "හැටන්",          country: "LK", lat: 6.89,  lng: 80.60 },
  { id: "polonnaruwa",   name: "Polonnaruwa", native: "පොළොන්නරුව",     country: "LK", lat: 7.94,  lng: 81.00 },
  // INDONESIA — east Java + Solo branch
  { id: "solo",          name: "Solo Balapan", native: "Solo Balapan",    country: "ID", lat: -7.56, lng: 110.83 },
  { id: "probolinggo",   name: "Probolinggo", native: "Probolinggo",     country: "ID", lat: -7.75, lng: 113.21 },
  { id: "banyuwangi",    name: "Banyuwangi", native: "Banyuwangi",      country: "ID", lat: -8.20, lng: 114.37 },
  // KOREA — KTX extensions + secondary cities
  { id: "cheongju",      name: "Cheongju", native: "청주",        country: "KR", lat: 36.64, lng: 127.49 },
  { id: "wonju",         name: "Wonju", native: "원주",           country: "KR", lat: 37.34, lng: 127.96 },
  { id: "ulsan",         name: "Ulsan", native: "울산",           country: "KR", lat: 35.55, lng: 129.31 },
  { id: "jeonju",        name: "Jeonju", native: "전주",          country: "KR", lat: 35.84, lng: 127.13 },
  // IRAN — Tehran–Mashhad intermediates
  { id: "semnan",        name: "Semnan", native: "سمنان",          country: "IR", lat: 35.58, lng: 53.39 },
  { id: "shahrud",       name: "Shahrud", native: "شاهرود",         country: "IR", lat: 36.42, lng: 54.98 },
  // TÜRKIYE — Doğu Express intermediates
  { id: "erzincan",      name: "Erzincan", native: "Erzincan",        country: "TR", lat: 39.75, lng: 39.49 },
  { id: "erzurum",       name: "Erzurum", native: "Erzurum",         country: "TR", lat: 39.91, lng: 41.27 },
  // MONGOLIA — eastern terminus
  { id: "choibalsan",    name: "Choibalsan", native: "Чойбалсан",      country: "MN", lat: 48.07, lng: 114.55 },
  // CAMBODIA — northwestern intermediates
  { id: "battambang",    name: "Battambang", native: "បាត់ដំបង",      country: "KH", lat: 13.10, lng: 103.20 },
  { id: "pursat",        name: "Pursat", native: "ពោធិសាត់",          country: "KH", lat: 12.53, lng: 103.92 },
  // MYANMAR — Pyay + Bagan
  { id: "pyay",          name: "Pyay", native: "ပြည်",            country: "MM", lat: 18.82, lng: 95.22 },
  { id: "bagan",         name: "Bagan", native: "ပုဂံ",           country: "MM", lat: 21.17, lng: 94.86 },
  // JAPAN — Tokyo metro Shinagawa + Shizuoka coastal extras
  { id: "shinagawa",     name: "Shinagawa", native: "品川",       country: "JP", lat: 35.63, lng: 139.74 },
  { id: "odawara",       name: "Odawara", native: "小田原",         country: "JP", lat: 35.26, lng: 139.16 },
  // SAUDI — Hail on the Saudi Land Bridge
  { id: "hail",          name: "Ha'il", native: "حائل",           country: "SA", lat: 27.52, lng: 41.69 },
  { id: "qassim",        name: "Buraidah (Qassim)", native: "بريدة", country: "SA", lat: 26.33, lng: 43.97 },
  // CAUCASUS — Armenia/Azerbaijan extras
  { id: "gyumri",        name: "Gyumri", native: "Գյումրի",          country: "AM", lat: 40.79, lng: 43.85 },

  // ==========  v0.13 — more intermediate stations  ==========
  { id: "huzhou",        name: "Huzhou",        native:"湖州",   country: "CN", lat: 30.89, lng: 120.09 },
  { id: "wuhu",          name: "Wuhu",          native:"芜湖",   country: "CN", lat: 31.35, lng: 118.43 },
  { id: "anqing",        name: "Anqing",        native:"安庆",   country: "CN", lat: 30.51, lng: 117.05 },
  { id: "lianyungang",   name: "Lianyungang",   native:"连云港", country: "CN", lat: 34.60, lng: 119.22 },
  { id: "yangzhou",      name: "Yangzhou",      native:"扬州",   country: "CN", lat: 32.39, lng: 119.42 },
  { id: "taizhou_js",    name: "Taizhou (Jiangsu)", native:"泰州", country: "CN", lat: 32.46, lng: 119.92 },
  { id: "yiwu",          name: "Yiwu",          native:"义乌",   country: "CN", lat: 29.31, lng: 120.07 },
  { id: "jinhua",        name: "Jinhua",        native:"金华",   country: "CN", lat: 29.08, lng: 119.65 },
  { id: "putian",        name: "Putian",        native:"莆田",   country: "CN", lat: 25.43, lng: 119.01 },
  { id: "quanzhou",      name: "Quanzhou",      native:"泉州",   country: "CN", lat: 24.87, lng: 118.68 },
  { id: "shantou",       name: "Shantou",       native:"汕头",   country: "CN", lat: 23.36, lng: 116.68 },
  { id: "chaozhou",      name: "Chaozhou",      native:"潮州",   country: "CN", lat: 23.66, lng: 116.62 },
  { id: "huizhou",       name: "Huizhou",       native:"惠州",   country: "CN", lat: 23.11, lng: 114.41 },
  { id: "meizhou",       name: "Meizhou",       native:"梅州",   country: "CN", lat: 24.30, lng: 116.12 },
  { id: "guilin",        name: "Guilin",        native:"桂林",   country: "CN", lat: 25.27, lng: 110.29 },
  { id: "liuzhou",       name: "Liuzhou",       native:"柳州",   country: "CN", lat: 24.32, lng: 109.42 },
  { id: "beihai",        name: "Beihai",        native:"北海",   country: "CN", lat: 21.48, lng: 109.12 },
  { id: "yulin_gx",      name: "Yulin",         native:"玉林",   country: "CN", lat: 22.65, lng: 110.16 },
  { id: "neijiang",      name: "Neijiang",      native:"内江",   country: "CN", lat: 29.59, lng: 105.06 },
  { id: "leshan",        name: "Leshan",        native:"乐山",   country: "CN", lat: 29.55, lng: 103.77 },
  { id: "yibin",         name: "Yibin",         native:"宜宾",   country: "CN", lat: 28.77, lng: 104.62 },
  { id: "dali_cn",       name: "Dali",          native:"大理",   country: "CN", lat: 25.61, lng: 100.27 },
  { id: "lijiang",       name: "Lijiang",       native:"丽江",   country: "CN", lat: 26.86, lng: 100.23 },
  { id: "shangrao",      name: "Shangrao",      native:"上饶",   country: "CN", lat: 28.45, lng: 117.95 },
  { id: "xiangyang",     name: "Xiangyang",     native:"襄阳",   country: "CN", lat: 32.01, lng: 112.12 },
  { id: "shiyan",        name: "Shiyan",        native:"十堰",   country: "CN", lat: 32.65, lng: 110.78 },
  { id: "tianshui",      name: "Tianshui",      native:"天水",   country: "CN", lat: 34.58, lng: 105.72 },
  { id: "baoji",         name: "Baoji",         native:"宝鸡",   country: "CN", lat: 34.36, lng: 107.14 },
  { id: "yanan",         name: "Yan'an",        native:"延安",   country: "CN", lat: 36.59, lng: 109.49 },
  { id: "yinchuan",      name: "Yinchuan",      native:"银川",   country: "CN", lat: 38.49, lng: 106.23 },
  { id: "ordos",         name: "Ordos",         native:"鄂尔多斯", country: "CN", lat: 39.61, lng: 109.78 },
  // INDIA
  { id: "raipur",        name: "Raipur",        native:"रायपुर",   country: "IN", lat: 21.25, lng: 81.63 },
  { id: "bilaspur",      name: "Bilaspur",      native:"बिलासपुर",  country: "IN", lat: 22.08, lng: 82.15 },
  { id: "rourkela",      name: "Rourkela",      native:"ରାଉରକେଲା", country: "IN", lat: 22.23, lng: 84.86 },
  { id: "asansol",       name: "Asansol",       native:"আসানসোল",  country: "IN", lat: 23.69, lng: 86.97 },
  { id: "dhanbad",       name: "Dhanbad",       native:"धनबाद",     country: "IN", lat: 23.79, lng: 86.43 },
  { id: "gaya",          name: "Gaya",          native:"गया",        country: "IN", lat: 24.79, lng: 85.00 },
  { id: "indore",        name: "Indore",        native:"इंदौर",     country: "IN", lat: 22.72, lng: 75.86 },
  { id: "ratlam",        name: "Ratlam",        native:"रतलाम",     country: "IN", lat: 23.33, lng: 75.04 },
  { id: "akola",         name: "Akola",         native:"अकोला",     country: "IN", lat: 20.71, lng: 77.00 },
  { id: "solapur",       name: "Solapur",       native:"सोलापूर",   country: "IN", lat: 17.66, lng: 75.91 },
  { id: "kolhapur",      name: "Kolhapur",      native:"कोल्हापूर",  country: "IN", lat: 16.69, lng: 74.24 },
  { id: "tirupati",      name: "Tirupati",      native:"తిరుపతి",   country: "IN", lat: 13.63, lng: 79.42 },
  { id: "ajmer",         name: "Ajmer",         native:"अजमेर",     country: "IN", lat: 26.45, lng: 74.64 },
  { id: "jodhpur",       name: "Jodhpur",       native:"जोधपुर",    country: "IN", lat: 26.29, lng: 73.03 },
  { id: "udaipur",       name: "Udaipur",       native:"उदयपुर",    country: "IN", lat: 24.58, lng: 73.69 },
  // RUSSIA
  { id: "tver",          name: "Tver",          native:"Тверь",   country: "RU", lat: 56.86, lng: 35.92 },
  { id: "vyborg",        name: "Vyborg",        native:"Выборг",  country: "RU", lat: 60.71, lng: 28.75 },
  { id: "petrozavodsk",  name: "Petrozavodsk",  native:"Петрозаводск", country: "RU", lat: 61.79, lng: 34.37 },
  { id: "murmansk",      name: "Murmansk",      native:"Мурманск", country: "RU", lat: 68.97, lng: 33.08 },
  { id: "izhevsk",       name: "Izhevsk",       native:"Ижевск",  country: "RU", lat: 56.85, lng: 53.21 },
  { id: "orenburg",      name: "Orenburg",      native:"Оренбург", country: "RU", lat: 51.77, lng: 55.10 },
  { id: "minvody",       name: "Mineralnye Vody", native:"Минеральные Воды", country: "RU", lat: 44.21, lng: 43.13 },
  // JAPAN
  { id: "yamagata",      name: "Yamagata",      native:"山形",     country: "JP", lat: 38.25, lng: 140.34 },
  { id: "akita",         name: "Akita",         native:"秋田",     country: "JP", lat: 39.72, lng: 140.10 },
  { id: "shinyokohama",  name: "Shin-Yokohama", native:"新横浜",  country: "JP", lat: 35.51, lng: 139.62 },
  { id: "kokura",        name: "Kokura",        native:"小倉",     country: "JP", lat: 33.89, lng: 130.88 },
  { id: "kumamoto",      name: "Kumamoto",      native:"熊本",     country: "JP", lat: 32.79, lng: 130.69 },
  // Korea / Türkiye / Kazakhstan / Indonesia
  { id: "incheon",       name: "Incheon",       native:"인천",     country: "KR", lat: 37.48, lng: 126.63 },
  { id: "afyon",         name: "Afyonkarahisar", native:"Afyon",  country: "TR", lat: 38.76, lng: 30.54 },
  { id: "karaganda",     name: "Karaganda",     native:"Қарағанды", country: "KZ", lat: 49.81, lng: 73.09 },
  { id: "tegal",         name: "Tegal", native: "Tegal",         country: "ID", lat: -6.87, lng: 109.13 },
  { id: "malang",        name: "Malang", native: "Malang",        country: "ID", lat: -7.98, lng: 112.63 },
];

// =============================================================
// ROUTES — bidirectional. type: "hsr" (high-speed) | "conv" (conventional).
// =============================================================
window.ROUTES = [

  // ==========  CHINA HSR — Jinghu (Beijing–Shanghai) corridor + intermediates  ==========
  { from: "beijing",      to: "tianjin",      h: 0.5,  type: "hsr",  line: "Jingjin Intercity",      op: "China Railway" },
  { from: "beijing",      to: "cangzhou",     h: 1.1,  type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "cangzhou",     to: "dezhou",       h: 0.6,  type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "dezhou",       to: "jinan",        h: 0.5,  type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "jinan",        to: "taian",        h: 0.25, type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "taian",        to: "xuzhou",       h: 1.25, type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "xuzhou",       to: "bengbu",       h: 0.6,  type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "bengbu",       to: "nanjing",      h: 1.0,  type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "nanjing",      to: "wuxi",         h: 0.75, type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "wuxi",         to: "suzhou_js",    h: 0.25, type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "suzhou_js",    to: "shanghai",     h: 0.5,  type: "hsr",  line: "Jinghu HSR",             op: "China Railway" },
  { from: "jinan",        to: "qingdao",      h: 1.5,  type: "hsr",  line: "Jiqing HSR",             op: "China Railway" },

  // Express through-service edges (G-trains that skip intermediates)
  { from: "beijing",      to: "jinan",        h: 1.5,  type: "hsr",  line: "Jinghu HSR (express)",   op: "China Railway" },
  { from: "beijing",      to: "shanghai",     h: 4.25, type: "hsr",  line: "Jinghu HSR G1/G7 (express)", op: "China Railway" },
  { from: "jinan",        to: "shanghai",     h: 3.25, type: "hsr",  line: "Jinghu HSR (express)",   op: "China Railway" },

  // ==========  CHINA HSR — Jingguang (Beijing–Guangzhou) + intermediates  ==========
  { from: "beijing",      to: "baoding",      h: 0.75, type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "baoding",      to: "shijiazhuang", h: 0.6,  type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "shijiazhuang", to: "handan",       h: 0.75, type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "handan",       to: "anyang",       h: 0.25, type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "anyang",       to: "zhengzhou",    h: 1.0,  type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "zhengzhou",    to: "xinyang",      h: 1.25, type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "xinyang",      to: "wuhan",        h: 1.0,  type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "wuhan",        to: "changsha",     h: 1.5,  type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "changsha",     to: "hengyang",     h: 0.6,  type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "hengyang",     to: "shaoguan",     h: 1.0,  type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  { from: "shaoguan",     to: "guangzhou",    h: 0.75, type: "hsr",  line: "Jingguang HSR",          op: "China Railway" },
  // Express through-service edges
  { from: "beijing",      to: "zhengzhou",    h: 2.5,  type: "hsr",  line: "Jingguang HSR (express)", op: "China Railway" },
  { from: "zhengzhou",    to: "wuhan",        h: 2.0,  type: "hsr",  line: "Jingguang HSR (express)", op: "China Railway" },
  { from: "changsha",     to: "guangzhou",    h: 2.25, type: "hsr",  line: "Jingguang HSR (express)", op: "China Railway" },
  { from: "shijiazhuang", to: "zhengzhou",    h: 1.5,  type: "hsr",  line: "Jingguang HSR (express)", op: "China Railway" },
  { from: "shijiazhuang", to: "taiyuan",      h: 1.0,  type: "hsr",  line: "Shitai PDL",              op: "China Railway" },

  // ==========  CHINA HSR — Datong / Hohhot / Northeast  ==========
  { from: "datong",       to: "beijing",      h: 1.75, type: "hsr",  line: "Jingbao HSR",            op: "China Railway" },
  { from: "taiyuan",      to: "datong",       h: 1.5,  type: "hsr",  line: "Datai HSR",              op: "China Railway" },
  { from: "beijing",      to: "hohhot",       h: 2.25, type: "hsr",  line: "Zhanghu HSR",            op: "China Railway" },
  { from: "hohhot",       to: "datong",       h: 1.5,  type: "hsr",  line: "Zhanghu HSR",            op: "China Railway" },
  { from: "beijing",      to: "shenyang",     h: 2.5,  type: "hsr",  line: "Jingshen HSR",           op: "China Railway" },
  { from: "tianjin",      to: "shenyang",     h: 3.0,  type: "hsr",  line: "Jinqin HSR",             op: "China Railway" },
  { from: "shenyang",     to: "changchun",    h: 1.5,  type: "hsr",  line: "Hada HSR",               op: "China Railway" },
  { from: "changchun",    to: "harbin",       h: 1.0,  type: "hsr",  line: "Hada HSR",               op: "China Railway" },
  { from: "shenyang",     to: "dalian",       h: 2.0,  type: "hsr",  line: "Hada PDL",               op: "China Railway" },
  { from: "shenyang",     to: "dandong",      h: 1.25, type: "hsr",  line: "Shendan HSR",            op: "China Railway" },

  // ==========  CHINA HSR — Yangtze delta + Southeast coast  ==========
  { from: "nanjing",      to: "shanghai",     h: 1.0,  type: "hsr",  line: "Huning HSR",             op: "China Railway" },
  { from: "nanjing",      to: "hefei",        h: 1.0,  type: "hsr",  line: "Hening HSR",             op: "China Railway" },
  { from: "shanghai",     to: "hangzhou",     h: 1.0,  type: "hsr",  line: "Huhang HSR",             op: "China Railway" },
  { from: "shanghai",     to: "hefei",        h: 2.5,  type: "hsr",  line: "Hushang HSR",            op: "China Railway" },
  { from: "hangzhou",     to: "nanchang",     h: 2.5,  type: "hsr",  line: "Hangchang HSR",          op: "China Railway" },
  { from: "hangzhou",     to: "fuzhou",       h: 3.0,  type: "hsr",  line: "Hangshen HSR",           op: "China Railway" },
  { from: "fuzhou",       to: "xiamen",       h: 1.5,  type: "hsr",  line: "Fuxia HSR",              op: "China Railway" },
  { from: "xiamen",       to: "shenzhen",     h: 3.5,  type: "hsr",  line: "Xiashen HSR",            op: "China Railway" },
  { from: "wuhan",        to: "hefei",        h: 2.0,  type: "hsr",  line: "Hewu HSR",               op: "China Railway" },
  { from: "wuhan",        to: "nanchang",     h: 2.0,  type: "hsr",  line: "Wujiu HSR",              op: "China Railway" },
  { from: "nanchang",     to: "changsha",     h: 1.5,  type: "hsr",  line: "Huku HSR",               op: "China Railway" },
  { from: "nanchang",     to: "fuzhou",       h: 3.0,  type: "hsr",  line: "Hangchang HSR",          op: "China Railway" },

  // ==========  CHINA HSR — West (Xi'an, Sichuan, Yunnan, Lan-Xin)  ==========
  { from: "zhengzhou",    to: "xian",         h: 2.0,  type: "hsr",  line: "Zhengxi HSR",            op: "China Railway" },
  { from: "xian",         to: "chengdu",      h: 3.0,  type: "hsr",  line: "Xicheng HSR",            op: "China Railway" },
  { from: "xian",         to: "lanzhou",      h: 3.0,  type: "hsr",  line: "Xilan HSR",              op: "China Railway" },
  { from: "xian",         to: "taiyuan",      h: 3.0,  type: "hsr",  line: "Datai/Xiyuan",           op: "China Railway" },
  { from: "lanzhou",      to: "xining",       h: 1.0,  type: "hsr",  line: "Lanxin HSR",             op: "China Railway" },
  { from: "lanzhou",      to: "wuwei",        h: 1.75, type: "hsr",  line: "Lanxin HSR",             op: "China Railway" },
  { from: "wuwei",        to: "zhangye",      h: 1.0,  type: "hsr",  line: "Lanxin HSR",             op: "China Railway" },
  { from: "zhangye",      to: "jiayuguan",    h: 1.5,  type: "hsr",  line: "Lanxin HSR",             op: "China Railway" },
  { from: "jiayuguan",    to: "hami",         h: 4.0,  type: "hsr",  line: "Lanxin HSR",             op: "China Railway" },
  { from: "hami",         to: "turpan",       h: 2.0,  type: "hsr",  line: "Lanxin HSR",             op: "China Railway" },
  { from: "turpan",       to: "urumqi",       h: 1.0,  type: "hsr",  line: "Lanxin HSR",             op: "China Railway" },
  { from: "chengdu",      to: "chongqing",    h: 1.5,  type: "hsr",  line: "Chengyu HSR",            op: "China Railway" },
  { from: "chongqing",    to: "guiyang",      h: 2.0,  type: "hsr",  line: "Yugui HSR",              op: "China Railway" },
  { from: "guiyang",      to: "kunming",      h: 2.5,  type: "hsr",  line: "Hukun HSR",              op: "China Railway" },
  { from: "guiyang",      to: "changsha",     h: 2.5,  type: "hsr",  line: "Hukun HSR",              op: "China Railway" },
  { from: "guiyang",      to: "guangzhou",    h: 4.0,  type: "hsr",  line: "Guiguang HSR",           op: "China Railway" },
  { from: "kunming",      to: "chengdu",      h: 6.5,  type: "hsr",  line: "Chengkun HSR",           op: "China Railway" },

  // ==========  CHINA HSR — South + HK  ==========
  { from: "guangzhou",    to: "shenzhen",     h: 0.5,  type: "hsr",  line: "Guangshen HSR",          op: "China Railway" },
  { from: "shenzhen",     to: "hongkong",     h: 0.25, type: "hsr",  line: "GZ–KL XRL",              op: "MTR / China Railway" },
  { from: "guangzhou",    to: "hongkong",     h: 1.0,  type: "hsr",  line: "GZ–KL XRL through service", op: "MTR / China Railway" },
  { from: "guangzhou",    to: "nanning",      h: 4.0,  type: "hsr",  line: "Nanguang HSR",           op: "China Railway" },
  { from: "nanning",      to: "kunming",      h: 4.5,  type: "hsr",  line: "Yungui HSR",             op: "China Railway" },
  { from: "nanning",      to: "pingxiang_cn", h: 3.5,  type: "conv", line: "Xiangguì (Nanning–Pingxiang)", op: "China Railway" },

  // ==========  CHINA conventional / sleeper  ==========
  { from: "xining",       to: "lhasa",        h: 22.0, type: "conv", line: "Qinghai–Tibet Railway Z21/22", op: "China Railway" },
  { from: "lanzhou",      to: "lhasa",        h: 24.0, type: "conv", line: "Lanqing + Qinghai–Tibet", op: "China Railway" },
  { from: "chengdu",      to: "lhasa",        h: 36.0, type: "conv", line: "Z322 sleeper",            op: "China Railway" },

  // ==========  CHINA ↔ MONGOLIA ↔ RUSSIA (Trans-Mongolian K23 / Trans-Manchurian K19)  ==========
  { from: "beijing",      to: "erenhot",      h: 12.0, type: "conv", line: "Trans-Mongolian (K23)",  op: "China Railway" },
  { from: "erenhot",      to: "zamiin_uud",   h: 1.0,  type: "conv", line: "Border + bogie change",   op: "CR / UBTZ" },
  { from: "zamiin_uud",   to: "choir",        h: 8.0,  type: "conv", line: "UBTZ South Line",         op: "UBTZ" },
  { from: "choir",        to: "ulaanbaatar",  h: 6.0,  type: "conv", line: "UBTZ South Line",         op: "UBTZ" },
  { from: "ulaanbaatar",  to: "darkhan",      h: 5.0,  type: "conv", line: "UBTZ North Line",         op: "UBTZ" },
  { from: "darkhan",      to: "sukhbaatar",   h: 4.0,  type: "conv", line: "UBTZ North Line",         op: "UBTZ" },
  { from: "sukhbaatar",   to: "naushki",      h: 1.0,  type: "conv", line: "Border crossing",         op: "RZD / UBTZ" },
  { from: "naushki",      to: "ulan_ude",     h: 7.0,  type: "conv", line: "Trans-Mongolian (Russia)", op: "RZD" },
  { from: "ulan_ude",     to: "irkutsk",      h: 8.0,  type: "conv", line: "Trans-Siberian",          op: "RZD" },
  { from: "ulan_ude",     to: "chita",        h: 10.0, type: "conv", line: "Trans-Siberian",          op: "RZD" },
  { from: "chita",        to: "zabaikalsk",   h: 12.0, type: "conv", line: "Trans-Manchurian branch", op: "RZD" },
  { from: "zabaikalsk",   to: "manzhouli",    h: 1.0,  type: "conv", line: "Border + bogie change",   op: "RZD / CR" },
  { from: "manzhouli",    to: "harbin",       h: 12.0, type: "conv", line: "Binzhou Railway",         op: "China Railway" },
  { from: "chita",        to: "khabarovsk",   h: 38.0, type: "conv", line: "Trans-Siberian",          op: "RZD" },
  { from: "khabarovsk",   to: "vladivostok",  h: 13.0, type: "conv", line: "Trans-Siberian (Rossiya)", op: "RZD" },
  { from: "irkutsk",      to: "krasnoyarsk",  h: 19.0, type: "conv", line: "Trans-Siberian",          op: "RZD" },
  { from: "krasnoyarsk",  to: "novosibirsk",  h: 12.0, type: "conv", line: "Trans-Siberian",          op: "RZD" },
  { from: "novosibirsk",  to: "omsk",         h: 9.0,  type: "conv", line: "Trans-Siberian",          op: "RZD" },
  { from: "omsk",         to: "yekaterinburg",h: 13.0, type: "conv", line: "Trans-Siberian",          op: "RZD" },
  { from: "yekaterinburg",to: "moscow",       h: 25.0, type: "conv", line: "Trans-Siberian (Rossiya)", op: "RZD" },

  // ==========  CHINA ↔ NORTH KOREA (Beijing–Pyongyang K27/K28)  ==========
  { from: "dandong",      to: "sinuiju",      h: 1.5,  type: "conv", line: "Border + gauge",          op: "CR / KSR" },
  { from: "sinuiju",      to: "pyongyang",    h: 5.0,  type: "conv", line: "Pyongui Line",            op: "Korean State Railway" },

  // ==========  SOUTH KOREA (KTX + SRT)  ==========
  { from: "seoul",        to: "suwon",        h: 0.5,  type: "conv", line: "Gyeongbu Line",           op: "Korail" },
  { from: "seoul",        to: "daejeon",      h: 1.0,  type: "hsr",  line: "KTX Gyeongbu",            op: "Korail" },
  { from: "daejeon",      to: "daegu",        h: 0.75, type: "hsr",  line: "KTX Gyeongbu",            op: "Korail" },
  { from: "daegu",        to: "busan",        h: 0.5,  type: "hsr",  line: "KTX Gyeongbu",            op: "Korail" },
  { from: "seoul",        to: "busan",        h: 2.5,  type: "hsr",  line: "KTX Gyeongbu (express)",  op: "Korail" },
  { from: "seoul",        to: "gwangju",      h: 1.75, type: "hsr",  line: "KTX Honam",               op: "Korail" },
  { from: "gwangju",      to: "mokpo",        h: 0.75, type: "hsr",  line: "KTX Honam",               op: "Korail" },

  // ==========  JAPAN (Shinkansen)  ==========
  { from: "tokyo",        to: "yokohama",     h: 0.4,  type: "conv", line: "JR Tōkaidō Line",         op: "JR East" },
  { from: "tokyo",        to: "nagoya",       h: 1.6,  type: "hsr",  line: "Tōkaidō Shinkansen (Nozomi)", op: "JR Central" },
  { from: "nagoya",       to: "kyoto",        h: 0.6,  type: "hsr",  line: "Tōkaidō Shinkansen",      op: "JR Central" },
  { from: "kyoto",        to: "shin_osaka",   h: 0.25, type: "hsr",  line: "Tōkaidō Shinkansen",      op: "JR Central" },
  { from: "shin_osaka",   to: "shin_kobe",    h: 0.2,  type: "hsr",  line: "San'yō Shinkansen",       op: "JR West" },
  { from: "shin_kobe",    to: "okayama",      h: 0.6,  type: "hsr",  line: "San'yō Shinkansen",       op: "JR West" },
  { from: "okayama",      to: "hiroshima",    h: 0.7,  type: "hsr",  line: "San'yō Shinkansen",       op: "JR West" },
  { from: "hiroshima",    to: "hakata",       h: 1.1,  type: "hsr",  line: "San'yō Shinkansen",       op: "JR West" },
  { from: "hakata",       to: "kagoshima",    h: 1.5,  type: "hsr",  line: "Kyūshū Shinkansen",       op: "JR Kyushu" },
  { from: "tokyo",        to: "sendai",       h: 1.5,  type: "hsr",  line: "Tōhoku Shinkansen (Hayabusa)", op: "JR East" },
  { from: "sendai",       to: "morioka",      h: 1.25, type: "hsr",  line: "Tōhoku Shinkansen",       op: "JR East" },
  { from: "morioka",      to: "aomori",       h: 0.75, type: "hsr",  line: "Tōhoku Shinkansen",       op: "JR East" },
  { from: "aomori",       to: "hakodate",     h: 1.0,  type: "hsr",  line: "Hokkaidō Shinkansen",     op: "JR Hokkaido" },
  { from: "hakodate",     to: "sapporo",      h: 3.5,  type: "conv", line: "Hokuto limited express",  op: "JR Hokkaido" },
  { from: "tokyo",        to: "kanazawa",     h: 2.5,  type: "hsr",  line: "Hokuriku Shinkansen",     op: "JR East / West" },
  { from: "tokyo",        to: "niigata",      h: 2.0,  type: "hsr",  line: "Jōetsu Shinkansen",       op: "JR East" },

  // ==========  VIETNAM  ==========
  { from: "hanoi",        to: "dongdang",     h: 4.0,  type: "conv", line: "Hanoi–Đồng Đăng Line",    op: "Vietnam Railways" },
  { from: "hanoi",        to: "haiphong",     h: 2.5,  type: "conv", line: "Hanoi–Hải Phòng Line",    op: "Vietnam Railways" },
  { from: "hanoi",        to: "laocai",       h: 8.0,  type: "conv", line: "Hanoi–Lào Cai overnight", op: "Vietnam Railways" },
  { from: "hanoi",        to: "vinh",         h: 6.0,  type: "conv", line: "Reunification Express",   op: "Vietnam Railways" },
  { from: "vinh",         to: "hue",          h: 8.0,  type: "conv", line: "Reunification Express",   op: "Vietnam Railways" },
  { from: "hue",          to: "danang",       h: 2.5,  type: "conv", line: "Reunification Express",   op: "Vietnam Railways" },
  { from: "danang",       to: "nhatrang",     h: 9.0,  type: "conv", line: "Reunification Express",   op: "Vietnam Railways" },
  { from: "nhatrang",     to: "hcmc",         h: 7.0,  type: "conv", line: "Reunification Express",   op: "Vietnam Railways" },
  // China–Vietnam through service
  { from: "dongdang",     to: "pingxiang_cn", h: 1.0,  type: "conv", line: "Hữu Nghị border",         op: "VR / CR" },
  { from: "nanning",      to: "hanoi",        h: 11.0, type: "conv", line: "MR1 (Nanning–Hanoi)",     op: "CR / VR" },

  // ==========  LAOS — China–Laos Railway  ==========
  { from: "kunming",      to: "boten",        h: 4.0,  type: "hsr",  line: "China–Laos Railway",      op: "China Railway" },
  { from: "boten",        to: "luangprabang", h: 2.0,  type: "hsr",  line: "China–Laos Railway",      op: "LCR" },
  { from: "luangprabang", to: "vangvieng",    h: 1.0,  type: "hsr",  line: "China–Laos Railway",      op: "LCR" },
  { from: "vangvieng",    to: "vientiane",    h: 1.0,  type: "hsr",  line: "China–Laos Railway",      op: "LCR" },

  // ==========  LAOS ↔ THAILAND ↔ CAMBODIA ↔ MALAYSIA ↔ SINGAPORE  ==========
  { from: "vientiane",    to: "nongkhai",     h: 0.5,  type: "conv", line: "Mekong shuttle",          op: "SRT / LSCo" },
  { from: "nongkhai",     to: "udonthani",    h: 1.0,  type: "conv", line: "SRT Northeastern Line",   op: "SRT" },
  { from: "udonthani",    to: "khonkaen",     h: 2.0,  type: "conv", line: "SRT Northeastern Line",   op: "SRT" },
  { from: "khonkaen",     to: "korat",        h: 3.0,  type: "conv", line: "SRT Northeastern Line",   op: "SRT" },
  { from: "korat",        to: "ayutthaya",    h: 3.5,  type: "conv", line: "SRT Northeastern Line",   op: "SRT" },
  { from: "ayutthaya",    to: "bangkok",      h: 1.5,  type: "conv", line: "SRT mainline",            op: "SRT" },
  { from: "ayutthaya",    to: "chiangmai",    h: 11.0, type: "conv", line: "SRT Northern Line (sleeper)", op: "SRT" },
  { from: "bangkok",      to: "huahin",       h: 4.0,  type: "conv", line: "SRT Southern Line",       op: "SRT" },
  { from: "huahin",       to: "suratthani",   h: 6.0,  type: "conv", line: "SRT Southern Line",       op: "SRT" },
  { from: "suratthani",   to: "hatyai",       h: 4.0,  type: "conv", line: "SRT Southern Line",       op: "SRT" },
  { from: "hatyai",       to: "padangbesar",  h: 1.5,  type: "conv", line: "SRT Southern Line",       op: "SRT" },
  { from: "bangkok",      to: "aranya",       h: 5.0,  type: "conv", line: "SRT Eastern Line",        op: "SRT" },
  { from: "aranya",       to: "poipet",       h: 0.5,  type: "conv", line: "Border crossing",         op: "SRT / RR" },
  { from: "poipet",       to: "sisophon",     h: 1.0,  type: "conv", line: "Royal Railway Northern",  op: "Royal Railway Cambodia" },
  { from: "sisophon",     to: "battambang",   h: 2.0,  type: "conv", line: "Royal Railway Northern",  op: "Royal Railway Cambodia" },
  { from: "poipet",       to: "phnompenh",    h: 12.0, type: "conv", line: "Royal Railway Northern (through)", op: "Royal Railway Cambodia" },
  { from: "phnompenh",    to: "kampot",       h: 5.0,  type: "conv", line: "Royal Railway Southern",  op: "Royal Railway Cambodia" },
  { from: "kampot",       to: "sihanoukville",h: 2.0,  type: "conv", line: "Royal Railway Southern",  op: "Royal Railway Cambodia" },
  { from: "phnompenh",    to: "sihanoukville",h: 7.0,  type: "conv", line: "Royal Railway Southern (through)", op: "Royal Railway Cambodia" },
  { from: "padangbesar",  to: "butterworth",  h: 2.0,  type: "conv", line: "KTM ETS",                  op: "KTM Berhad" },
  { from: "butterworth",  to: "ipoh",         h: 2.0,  type: "conv", line: "KTM ETS",                  op: "KTM Berhad" },
  { from: "ipoh",         to: "kualalumpur",  h: 2.5,  type: "conv", line: "KTM ETS",                  op: "KTM Berhad" },
  { from: "kualalumpur",  to: "gemas",        h: 3.0,  type: "conv", line: "KTM ETS",                  op: "KTM Berhad" },
  { from: "gemas",        to: "johorbahru",   h: 4.5,  type: "conv", line: "KTM Shuttle",              op: "KTM Berhad" },
  { from: "johorbahru",   to: "singapore",    h: 0.25, type: "conv", line: "JB–Woodlands shuttle",     op: "KTM / SMRT" },

  // ==========  MYANMAR (no current rail connection to neighbors)  ==========
  { from: "yangon",       to: "naypyidaw",    h: 9.0,  type: "conv", line: "Yangon–Mandalay mainline", op: "Myanmar Railways" },
  { from: "naypyidaw",    to: "mandalay",     h: 6.0,  type: "conv", line: "Yangon–Mandalay mainline", op: "Myanmar Railways" },

  // ==========  INDONESIA (Java only)  ==========
  { from: "jakarta",      to: "bandung",      h: 0.75, type: "hsr",  line: "Whoosh (KCIC)",            op: "KCIC" },
  { from: "jakarta",      to: "yogyakarta",   h: 7.0,  type: "conv", line: "KAI Argo / Bima",          op: "PT KAI" },
  { from: "yogyakarta",   to: "surabaya",     h: 4.5,  type: "conv", line: "KAI Argo Wilis",           op: "PT KAI" },
  { from: "bandung",      to: "yogyakarta",   h: 7.0,  type: "conv", line: "KAI Lodaya",               op: "PT KAI" },

  // ==========  INDIA — Northern + Central trunks  ==========
  { from: "delhi",        to: "amritsar",     h: 5.5,  type: "conv", line: "Shatabdi 12013/14",        op: "Indian Railways" },
  { from: "amritsar",     to: "jammu",        h: 6.0,  type: "conv", line: "Jammu–Amritsar Express",   op: "Indian Railways" },
  { from: "delhi",        to: "jammu",        h: 9.0,  type: "conv", line: "Rajdhani 12425",            op: "Indian Railways" },
  { from: "delhi",        to: "jaipur",       h: 4.5,  type: "conv", line: "Shatabdi 12015",            op: "Indian Railways" },
  { from: "jaipur",       to: "ahmedabad",    h: 9.5,  type: "conv", line: "Ashram Express",            op: "Indian Railways" },
  { from: "delhi",        to: "kota",         h: 5.5,  type: "conv", line: "Mumbai Rajdhani",           op: "Indian Railways" },
  { from: "kota",         to: "vadodara",     h: 5.5,  type: "conv", line: "Mumbai Rajdhani",           op: "Indian Railways" },
  { from: "vadodara",     to: "ahmedabad",    h: 1.5,  type: "conv", line: "Vande Bharat",              op: "Indian Railways" },
  { from: "vadodara",     to: "surat_in",     h: 1.5,  type: "conv", line: "Vande Bharat",              op: "Indian Railways" },
  { from: "surat_in",     to: "mumbai",       h: 3.5,  type: "conv", line: "Mumbai Rajdhani",           op: "Indian Railways" },
  { from: "mumbai",       to: "ahmedabad",    h: 5.5,  type: "conv", line: "Vande Bharat 20901",        op: "Indian Railways" },
  { from: "delhi",        to: "mumbai",       h: 15.5, type: "conv", line: "Mumbai Rajdhani 12951",     op: "Indian Railways" },
  { from: "mumbai",       to: "pune",         h: 3.5,  type: "conv", line: "Deccan Queen",              op: "Indian Railways" },
  { from: "delhi",        to: "bhopal",       h: 7.5,  type: "conv", line: "Shatabdi 12001",            op: "Indian Railways" },
  { from: "bhopal",       to: "nagpur",       h: 7.5,  type: "conv", line: "GT Express",                op: "Indian Railways" },
  { from: "nagpur",       to: "hyderabad_in", h: 11.0, type: "conv", line: "Tamil Nadu Express",        op: "Indian Railways" },

  // ==========  INDIA — Eastern trunk (Delhi–Kolkata)  ==========
  { from: "delhi",        to: "lucknow",      h: 6.5,  type: "conv", line: "Vande Bharat 22436",        op: "Indian Railways" },
  { from: "lucknow",      to: "varanasi",     h: 4.5,  type: "conv", line: "Vande Bharat",              op: "Indian Railways" },
  { from: "varanasi",     to: "patna",        h: 5.0,  type: "conv", line: "Vibhuti Express",           op: "Indian Railways" },
  { from: "patna",        to: "howrah",       h: 8.5,  type: "conv", line: "Howrah Rajdhani",           op: "Indian Railways" },
  { from: "delhi",        to: "howrah",       h: 17.0, type: "conv", line: "Howrah Rajdhani 12302",     op: "Indian Railways" },
  { from: "howrah",       to: "guwahati",     h: 18.0, type: "conv", line: "Saraighat Express",         op: "Indian Railways" },
  { from: "howrah",       to: "bhubaneswar",  h: 7.5,  type: "conv", line: "Howrah–Puri Shatabdi",      op: "Indian Railways" },
  { from: "bhubaneswar",  to: "vizag",        h: 7.5,  type: "conv", line: "Coromandel Express",        op: "Indian Railways" },
  { from: "vizag",        to: "vijayawada",   h: 6.0,  type: "conv", line: "Coromandel Express",        op: "Indian Railways" },
  { from: "vijayawada",   to: "chennai",      h: 7.0,  type: "conv", line: "Coromandel Express",        op: "Indian Railways" },
  { from: "howrah",       to: "chennai",      h: 27.0, type: "conv", line: "Coromandel Express",        op: "Indian Railways" },

  // ==========  INDIA — Southern  ==========
  { from: "chennai",      to: "bangalore",    h: 4.5,  type: "conv", line: "Vande Bharat",              op: "Indian Railways" },
  { from: "bangalore",    to: "hyderabad_in", h: 11.0, type: "conv", line: "Rajdhani 22692",            op: "Indian Railways" },
  { from: "chennai",      to: "madurai",      h: 7.5,  type: "conv", line: "Vaigai Express",            op: "Indian Railways" },
  { from: "madurai",      to: "trivandrum",   h: 7.0,  type: "conv", line: "Anantapuri Express",        op: "Indian Railways" },
  { from: "chennai",      to: "coimbatore",   h: 7.0,  type: "conv", line: "Shatabdi 12243",            op: "Indian Railways" },
  { from: "coimbatore",   to: "ernakulam",    h: 5.0,  type: "conv", line: "Intercity Express",         op: "Indian Railways" },
  { from: "ernakulam",    to: "trivandrum",   h: 4.0,  type: "conv", line: "Vande Bharat 20631",        op: "Indian Railways" },
  { from: "mumbai",       to: "bangalore",    h: 24.0, type: "conv", line: "Udyan Express",             op: "Indian Railways" },
  { from: "mumbai",       to: "chennai",      h: 26.0, type: "conv", line: "Mumbai–Chennai Mail",       op: "Indian Railways" },

  // ==========  INDIA ↔ BANGLADESH  ==========
  { from: "howrah",       to: "darshana",     h: 5.0,  type: "conv", line: "Maitree Express (India)",   op: "Indian Railways" },
  { from: "darshana",     to: "dhaka",        h: 4.0,  type: "conv", line: "Maitree Express (Bangladesh)", op: "Bangladesh Railway" },
  { from: "howrah",       to: "khulna",       h: 7.5,  type: "conv", line: "Bandhan Express",           op: "IR / BR" },

  // ==========  BANGLADESH  ==========
  { from: "dhaka",        to: "chittagong",   h: 7.0,  type: "conv", line: "Sonar Bangla Express",      op: "Bangladesh Railway" },
  { from: "dhaka",        to: "khulna",       h: 9.0,  type: "conv", line: "Sundarban Express",         op: "Bangladesh Railway" },
  { from: "dhaka",        to: "sylhet",       h: 7.0,  type: "conv", line: "Parabat Express",           op: "Bangladesh Railway" },
  { from: "dhaka",        to: "rajshahi",     h: 6.0,  type: "conv", line: "Silk City Express",         op: "Bangladesh Railway" },

  // ==========  PAKISTAN  ==========
  { from: "karachi",      to: "hyderabad_pk", h: 3.0,  type: "conv", line: "Karakoram Express",         op: "Pakistan Railways" },
  { from: "hyderabad_pk", to: "sukkur",       h: 5.0,  type: "conv", line: "Karakoram Express",         op: "Pakistan Railways" },
  { from: "sukkur",       to: "multan",       h: 5.0,  type: "conv", line: "Karakoram Express",         op: "Pakistan Railways" },
  { from: "multan",       to: "lahore",       h: 5.0,  type: "conv", line: "Green Line",                op: "Pakistan Railways" },
  { from: "karachi",      to: "lahore",       h: 17.0, type: "conv", line: "Green Line Express",        op: "Pakistan Railways" },
  { from: "lahore",       to: "faisalabad",   h: 2.5,  type: "conv", line: "Faisalabad Express",        op: "Pakistan Railways" },
  { from: "lahore",       to: "rawalpindi",   h: 4.0,  type: "conv", line: "Green Line",                op: "Pakistan Railways" },
  { from: "rawalpindi",   to: "peshawar",     h: 3.0,  type: "conv", line: "Awam Express",              op: "Pakistan Railways" },
  { from: "karachi",      to: "quetta",       h: 16.0, type: "conv", line: "Bolan Mail",                op: "Pakistan Railways" },

  // ==========  SRI LANKA  ==========
  { from: "colombo",      to: "kandy",        h: 3.0,  type: "conv", line: "Main Line",                 op: "Sri Lanka Railways" },
  { from: "colombo",      to: "galle",        h: 2.0,  type: "conv", line: "Coastal Line",              op: "Sri Lanka Railways" },
  { from: "colombo",      to: "anuradhapura", h: 4.5,  type: "conv", line: "Northern Line",             op: "Sri Lanka Railways" },
  { from: "anuradhapura", to: "jaffna",       h: 3.5,  type: "conv", line: "Yal Devi",                  op: "Sri Lanka Railways" },

  // ==========  IRAN  ==========
  { from: "tehran",       to: "qom",          h: 1.5,  type: "conv", line: "Tehran–Qom",                op: "RAI" },
  { from: "qom",          to: "isfahan",      h: 4.5,  type: "conv", line: "Tehran–Isfahan",            op: "RAI" },
  { from: "tehran",       to: "mashhad",      h: 11.0, type: "conv", line: "Simorgh / Fadak",           op: "RAI" },
  { from: "tehran",       to: "tabriz",       h: 12.0, type: "conv", line: "Tehran–Tabriz",             op: "RAI" },
  { from: "tehran",       to: "ahvaz",        h: 14.0, type: "conv", line: "Tehran–Ahvaz",              op: "RAI" },
  { from: "tehran",       to: "shiraz",       h: 14.0, type: "conv", line: "Tehran–Shiraz",             op: "RAI" },
  { from: "tehran",       to: "bandarabbas",  h: 18.0, type: "conv", line: "Tehran–Bandar Abbas",       op: "RAI" },
  { from: "tabriz",       to: "razi",         h: 10.0, type: "conv", line: "Tabriz–Razi (Iran side)",   op: "RAI" },
  { from: "mashhad",      to: "sarakhs",      h: 4.0,  type: "conv", line: "Mashhad–Sarakhs",            op: "RAI" },

  // ==========  IRAN ↔ TURKMENISTAN ↔ CENTRAL ASIA  ==========
  { from: "sarakhs",      to: "mary",         h: 5.0,  type: "conv", line: "Border + gauge",            op: "TDY / RAI" },
  { from: "mary",         to: "ashgabat",     h: 6.0,  type: "conv", line: "TDY mainline",              op: "TDY" },
  { from: "ashgabat",     to: "turkmenbashi", h: 12.0, type: "conv", line: "TDY mainline",              op: "TDY" },

  // ==========  CENTRAL ASIA  ==========
  { from: "almaty",       to: "shymkent",     h: 12.0, type: "conv", line: "Talgo Almaty–Shymkent",     op: "KTZ" },
  { from: "shymkent",     to: "astana",       h: 12.0, type: "conv", line: "Talgo (Saryarka)",          op: "KTZ" },
  { from: "almaty",       to: "astana",       h: 13.0, type: "conv", line: "Talgo (Tulpar)",            op: "KTZ" },
  { from: "astana",       to: "aktobe",       h: 24.0, type: "conv", line: "Astana–Mangyshlak",         op: "KTZ" },
  { from: "aktobe",       to: "atyrau",       h: 12.0, type: "conv", line: "Atyrau line",               op: "KTZ" },
  { from: "atyrau",       to: "aktau",        h: 14.0, type: "conv", line: "Mangyshlak line",           op: "KTZ" },
  { from: "shymkent",     to: "tashkent",     h: 5.0,  type: "conv", line: "Talgo (intl)",              op: "KTZ / UTY" },
  { from: "tashkent",     to: "samarkand",    h: 2.0,  type: "hsr",  line: "Afrosiyob",                 op: "Uzbekistan Railways" },
  { from: "samarkand",    to: "bukhara",      h: 1.5,  type: "hsr",  line: "Afrosiyob",                 op: "Uzbekistan Railways" },
  { from: "bukhara",      to: "khiva",        h: 6.0,  type: "conv", line: "Sharq",                      op: "Uzbekistan Railways" },
  // Fergana Valley + southern + Karakalpakstan branches
  { from: "tashkent",     to: "andijan",      h: 5.5,  type: "conv", line: "Tashkent–Andijon",          op: "Uzbekistan Railways" },
  { from: "samarkand",    to: "termez",       h: 7.0,  type: "conv", line: "Sharq (Termez branch)",     op: "Uzbekistan Railways" },
  { from: "khiva",        to: "nukus",        h: 3.0,  type: "conv", line: "Karakalpak branch",         op: "Uzbekistan Railways" },
  // Turkmenistan trans-Caspian intermediates
  { from: "mary",         to: "turkmenabat",  h: 3.0,  type: "conv", line: "Trans-Caspian",             op: "Türkmendemirýollary" },
  { from: "turkmenabat",  to: "bukhara",      h: 2.5,  type: "conv", line: "Trans-Caspian (UZ link)",   op: "TR / UZ" },
  { from: "tashkent",     to: "dushanbe",     h: 22.0, type: "conv", line: "Sughd connector",           op: "TJ Railways / UTY" },
  { from: "almaty",       to: "dostyk",       h: 14.0, type: "conv", line: "Almaty–Dostyk",             op: "KTZ" },
  { from: "dostyk",       to: "alashankou",   h: 0.5,  type: "conv", line: "Border + gauge",            op: "KTZ / CR" },
  { from: "alashankou",   to: "urumqi",       h: 11.0, type: "conv", line: "Beijiang Railway",          op: "China Railway" },

  // ==========  TURKEY + Caucasus (BTK)  ==========
  { from: "istanbul",     to: "eskisehir",    h: 2.5,  type: "hsr",  line: "YHT Yüksek Hızlı Tren",      op: "TCDD" },
  { from: "eskisehir",    to: "ankara",       h: 1.5,  type: "hsr",  line: "YHT",                        op: "TCDD" },
  { from: "ankara",       to: "konya",        h: 1.75, type: "hsr",  line: "YHT Konya",                  op: "TCDD" },
  { from: "eskisehir",    to: "konya",        h: 2.0,  type: "hsr",  line: "YHT",                        op: "TCDD" },
  { from: "ankara",       to: "sivas",        h: 2.0,  type: "hsr",  line: "YHT Sivas",                  op: "TCDD" },
  // Doğu Express — Ankara to Kars overnight; intermediates at Sivas, Erzincan, Erzurum,
  // and the Adana–Malatya–Diyarbakır branch share trackage.
  { from: "ankara",       to: "kars",         h: 24.0, type: "conv", line: "Doğu Express (through)",     op: "TCDD" },
  { from: "sivas",        to: "malatya",      h: 4.0,  type: "conv", line: "Güney Express",              op: "TCDD" },
  { from: "malatya",      to: "diyarbakir",   h: 4.5,  type: "conv", line: "Güney Express",              op: "TCDD" },
  { from: "ankara",       to: "diyarbakir",   h: 17.0, type: "conv", line: "Güney Express (through)",    op: "TCDD" },
  { from: "kars",         to: "tbilisi",      h: 12.0, type: "conv", line: "Baku–Tbilisi–Kars",          op: "TCDD / GR / ADY" },
  // BTK + Az main line intermediates (Aghstafa, Ganja, Yevlakh, Sumgait)
  { from: "tbilisi",      to: "agstafa",      h: 3.0,  type: "conv", line: "BTK / overnight",            op: "GR / ADY" },
  { from: "agstafa",      to: "ganja",        h: 1.5,  type: "conv", line: "BTK / overnight",            op: "GR / ADY" },
  { from: "ganja",        to: "yevlakh",      h: 1.5,  type: "conv", line: "ADY mainline",               op: "Azerbaijan Railways" },
  { from: "yevlakh",      to: "sumgait",      h: 4.5,  type: "conv", line: "ADY mainline",               op: "Azerbaijan Railways" },
  { from: "sumgait",      to: "baku",         h: 0.75, type: "conv", line: "ADY mainline",               op: "Azerbaijan Railways" },
  { from: "tbilisi",      to: "baku",         h: 12.0, type: "conv", line: "BTK / overnight (through)",  op: "GR / ADY" },
  { from: "tbilisi",      to: "vanadzor",     h: 5.0,  type: "conv", line: "Yerevan Express",            op: "South Caucasus Railway" },
  { from: "vanadzor",     to: "yerevan",      h: 6.0,  type: "conv", line: "Yerevan Express",            op: "South Caucasus Railway" },
  { from: "tbilisi",      to: "yerevan",      h: 11.0, type: "conv", line: "Yerevan Express (through)",  op: "South Caucasus Railway" },
  // Tbilisi–Batumi main line via Gori / Khashuri / Kutaisi. The
  // Stadler express stops at the intermediates listed below; the
  // direct edge captures express through-running.
  { from: "tbilisi",      to: "gori",         h: 1.25, type: "conv", line: "Stadler express",            op: "Georgian Railway" },
  { from: "gori",         to: "khashuri",     h: 0.75, type: "conv", line: "Stadler express",            op: "Georgian Railway" },
  { from: "khashuri",     to: "kutaisi",      h: 1.5,  type: "conv", line: "Stadler express",            op: "Georgian Railway" },
  { from: "kutaisi",      to: "batumi",       h: 1.5,  type: "conv", line: "Stadler express",            op: "Georgian Railway" },
  { from: "tbilisi",      to: "batumi",       h: 5.0,  type: "conv", line: "Stadler express (through)",  op: "Georgian Railway" },
  { from: "tbilisi",      to: "kutaisi",      h: 4.0,  type: "conv", line: "Tbilisi–Kutaisi express",    op: "Georgian Railway" },
  // West Georgia branches off Khashuri / Samtredia junction
  { from: "khashuri",     to: "poti",         h: 3.5,  type: "conv", line: "Poti overnight",             op: "Georgian Railway" },
  { from: "khashuri",     to: "zugdidi",      h: 4.5,  type: "conv", line: "Zugdidi overnight",          op: "Georgian Railway" },
  { from: "poti",         to: "zugdidi",      h: 1.5,  type: "conv", line: "West Georgia coastal",       op: "Georgian Railway" },
  { from: "tbilisi",      to: "zugdidi",      h: 8.0,  type: "conv", line: "Zugdidi overnight (through)", op: "Georgian Railway" },
  { from: "tbilisi",      to: "poti",         h: 7.0,  type: "conv", line: "Poti overnight (through)",   op: "Georgian Railway" },

  // ==========  ISRAEL  ==========
  { from: "telaviv",      to: "jerusalem",    h: 0.5,  type: "hsr",  line: "Tel Aviv–Jerusalem fast",    op: "Israel Railways" },
  { from: "telaviv",      to: "haifa",        h: 1.0,  type: "conv", line: "Coastal Line",               op: "Israel Railways" },
  { from: "telaviv",      to: "beersheba",    h: 1.5,  type: "conv", line: "Beersheba Line",             op: "Israel Railways" },

  // ==========  SAUDI ARABIA  ==========
  { from: "mecca",        to: "jeddah",       h: 0.6,  type: "hsr",  line: "Haramain HSR",               op: "SAR" },
  { from: "jeddah",       to: "medina",       h: 1.7,  type: "hsr",  line: "Haramain HSR",               op: "SAR" },
  { from: "riyadh",       to: "hofuf",        h: 2.0,  type: "conv", line: "SAR East line",              op: "SAR" },
  { from: "hofuf",        to: "dammam",       h: 1.5,  type: "conv", line: "SAR East line",              op: "SAR" },
  { from: "riyadh",       to: "dammam",       h: 4.0,  type: "conv", line: "SAR East line",              op: "SAR" },

  // ==========  IRAQ — IRR Baghdad–Basra sleeper + Mosul branch  ==========
  { from: "baghdad",      to: "basra",        h: 12.0, type: "conv", line: "IRR Night Express",          op: "Iraqi Republic Railways" },
  { from: "baghdad",      to: "mosul",        h: 7.0,  type: "conv", line: "IRR Mosul service",          op: "Iraqi Republic Railways" },

  // ==========  KYRGYZSTAN — Bishkek–Balykchy (Issyk-Kul, summer)  ==========
  { from: "bishkek",      to: "balykchy",     h: 5.0,  type: "conv", line: "Issyk-Kul tourist",          op: "Kyrgyz Temir Joly" },

  // ==========  UAE — Etihad Rail Hafeet Express (passenger)  ==========
  { from: "abudhabi",     to: "dubai",        h: 0.85, type: "hsr",  line: "Hafeet Express",             op: "Etihad Rail" },
  { from: "dubai",        to: "sharjah",      h: 0.2,  type: "hsr",  line: "Hafeet Express",             op: "Etihad Rail" },
  { from: "sharjah",      to: "fujairah",     h: 0.75, type: "hsr",  line: "Hafeet Express",             op: "Etihad Rail" },
  { from: "abudhabi",     to: "fujairah",     h: 1.75, type: "hsr",  line: "Hafeet Express (through)",   op: "Etihad Rail" },

  // ==========  TAIWAN — THSR (high-speed) + TRA (conv)  ==========
  { from: "taipei",       to: "banqiao",      h: 0.1,  type: "hsr",  line: "THSR",                       op: "Taiwan HSR" },
  { from: "banqiao",      to: "taoyuan_tw",   h: 0.15, type: "hsr",  line: "THSR",                       op: "Taiwan HSR" },
  { from: "taoyuan_tw",   to: "hsinchu",      h: 0.2,  type: "hsr",  line: "THSR",                       op: "Taiwan HSR" },
  { from: "hsinchu",      to: "taichung",     h: 0.4,  type: "hsr",  line: "THSR",                       op: "Taiwan HSR" },
  { from: "taichung",     to: "chiayi",       h: 0.4,  type: "hsr",  line: "THSR",                       op: "Taiwan HSR" },
  { from: "chiayi",       to: "tainan",       h: 0.25, type: "hsr",  line: "THSR",                       op: "Taiwan HSR" },
  { from: "tainan",       to: "kaohsiung",    h: 0.2,  type: "hsr",  line: "THSR (Zuoying)",             op: "Taiwan HSR" },
  { from: "taipei",       to: "kaohsiung",    h: 1.5,  type: "hsr",  line: "THSR (express)",             op: "Taiwan HSR" },
  { from: "taipei",       to: "hualien",      h: 2.0,  type: "conv", line: "TRA Puyuma Express",         op: "Taiwan Railways" },
  { from: "hualien",      to: "taitung",      h: 2.5,  type: "conv", line: "TRA East Line",              op: "Taiwan Railways" },
  { from: "taitung",      to: "kaohsiung",    h: 3.5,  type: "conv", line: "TRA South-Link",             op: "Taiwan Railways" },

  // ==========  NORTH KOREA additions  ==========
  { from: "pyongyang",    to: "kaesong",      h: 3.0,  type: "conv", line: "P'yŏngbu Line",              op: "Korean State Railway" },
  { from: "pyongyang",    to: "wonsan",       h: 5.0,  type: "conv", line: "P'yŏngra Line",              op: "Korean State Railway" },

  // ==========  JAPAN intermediate stops (Tokaido / San'yo locals)  ==========
  { from: "tokyo",        to: "shizuoka",     h: 0.7,  type: "hsr",  line: "Tōkaidō Shinkansen (Hikari)", op: "JR Central" },
  { from: "shizuoka",     to: "hamamatsu",    h: 0.4,  type: "hsr",  line: "Tōkaidō Shinkansen",         op: "JR Central" },
  { from: "hamamatsu",    to: "nagoya",       h: 0.4,  type: "hsr",  line: "Tōkaidō Shinkansen",         op: "JR Central" },
  { from: "shin_kobe",    to: "himeji",       h: 0.25, type: "hsr",  line: "San'yō Shinkansen",          op: "JR West" },
  { from: "himeji",       to: "okayama",      h: 0.3,  type: "hsr",  line: "San'yō Shinkansen",          op: "JR West" },
  { from: "okayama",      to: "fukuyama",     h: 0.2,  type: "hsr",  line: "San'yō Shinkansen",          op: "JR West" },
  { from: "fukuyama",     to: "hiroshima",    h: 0.4,  type: "hsr",  line: "San'yō Shinkansen",          op: "JR West" },

  // ==========  SOUTH KOREA intermediates  ==========
  { from: "seoul",        to: "cheonan_asan", h: 0.5,  type: "hsr",  line: "KTX Gyeongbu",               op: "Korail" },
  { from: "cheonan_asan", to: "daejeon",      h: 0.5,  type: "hsr",  line: "KTX Gyeongbu",               op: "Korail" },
  { from: "daegu",        to: "pohang",       h: 0.4,  type: "hsr",  line: "KTX Donghae",                op: "Korail" },

  // ==========  CHINA — Beijing–Harbin intermediates (Jingha HSR)  ==========
  { from: "beijing",      to: "qinhuangdao",  h: 1.5,  type: "hsr",  line: "Jinqin / Jingshen HSR",      op: "China Railway" },
  { from: "qinhuangdao",  to: "jinzhou",      h: 1.0,  type: "hsr",  line: "Jingshen HSR",               op: "China Railway" },
  { from: "jinzhou",      to: "shenyang",     h: 1.0,  type: "hsr",  line: "Jingshen HSR",               op: "China Railway" },
  { from: "shenyang",     to: "tieling",      h: 0.5,  type: "hsr",  line: "Hada HSR",                   op: "China Railway" },
  { from: "tieling",      to: "siping",       h: 0.5,  type: "hsr",  line: "Hada HSR",                   op: "China Railway" },
  { from: "siping",       to: "changchun",    h: 0.5,  type: "hsr",  line: "Hada HSR",                   op: "China Railway" },
  // Yueyang on Jingguang between Wuhan-Changsha
  { from: "wuhan",        to: "yueyang",      h: 0.75, type: "hsr",  line: "Jingguang HSR",              op: "China Railway" },
  { from: "yueyang",      to: "changsha",     h: 0.75, type: "hsr",  line: "Jingguang HSR",              op: "China Railway" },

  // ==========  INDIA intermediates  ==========
  { from: "delhi",        to: "aligarh",      h: 2.0,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "aligarh",      to: "lucknow",      h: 5.0,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "delhi",        to: "mathura",      h: 2.0,  type: "conv", line: "Mumbai Rajdhani",            op: "Indian Railways" },
  { from: "mathura",      to: "kota",         h: 4.5,  type: "conv", line: "Mumbai Rajdhani",            op: "Indian Railways" },
  { from: "lucknow",      to: "prayagraj",    h: 4.0,  type: "conv", line: "Vande Bharat",               op: "Indian Railways" },
  { from: "varanasi",     to: "ddu",          h: 0.5,  type: "conv", line: "Vibhuti Express",            op: "Indian Railways" },
  { from: "prayagraj",    to: "ddu",          h: 2.5,  type: "conv", line: "Vibhuti Express",            op: "Indian Railways" },
  { from: "ddu",          to: "patna",        h: 4.0,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },

  // ==========  RUSSIA — Trans-Siberian intermediates  ==========
  { from: "irkutsk",      to: "tayshet",      h: 12.0, type: "conv", line: "Trans-Siberian",             op: "RZD" },
  { from: "tayshet",      to: "krasnoyarsk",  h: 7.0,  type: "conv", line: "Trans-Siberian",             op: "RZD" },
  { from: "omsk",         to: "tyumen",       h: 9.0,  type: "conv", line: "Trans-Siberian",             op: "RZD" },
  { from: "tyumen",       to: "yekaterinburg",h: 4.0,  type: "conv", line: "Trans-Siberian",             op: "RZD" },
  { from: "yekaterinburg",to: "perm",         h: 5.0,  type: "conv", line: "Trans-Siberian",             op: "RZD" },
  { from: "perm",         to: "kirov",        h: 5.0,  type: "conv", line: "Trans-Siberian",             op: "RZD" },
  { from: "kirov",        to: "nnovgorod",    h: 10.0, type: "conv", line: "Trans-Siberian",             op: "RZD" },
  { from: "nnovgorod",    to: "moscow",       h: 4.0,  type: "hsr",  line: "Sapsan / Strizh",            op: "RZD" },

  // ==========  VIETNAM Reunification intermediate stops  ==========
  { from: "hanoi",        to: "thanhhoa",     h: 4.0,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },
  { from: "thanhhoa",     to: "vinh",         h: 2.0,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },
  { from: "vinh",         to: "donghoi",      h: 6.0,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },
  { from: "donghoi",      to: "hue",          h: 3.0,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },
  { from: "danang",       to: "quangngai",    h: 4.0,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },
  { from: "quangngai",    to: "tuyhoa",       h: 5.0,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },
  { from: "tuyhoa",       to: "nhatrang",     h: 2.0,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },
  { from: "nhatrang",     to: "phanthiet",    h: 4.0,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },
  { from: "phanthiet",    to: "hcmc",         h: 3.0,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },

  // ==========  THAILAND Northern Line intermediates  ==========
  { from: "ayutthaya",    to: "phitsanulok",  h: 5.0,  type: "conv", line: "SRT Northern Line",          op: "SRT" },
  { from: "phitsanulok",  to: "lampang",      h: 4.0,  type: "conv", line: "SRT Northern Line",          op: "SRT" },
  { from: "lampang",      to: "chiangmai",    h: 2.5,  type: "conv", line: "SRT Northern Line",          op: "SRT" },

  // ==========  INDONESIA Java intermediate stops  ==========
  { from: "jakarta",      to: "cirebon",      h: 3.0,  type: "conv", line: "KAI Argo Cheribon",          op: "PT KAI" },
  { from: "cirebon",      to: "semarang",     h: 3.0,  type: "conv", line: "KAI Argo Sindoro",           op: "PT KAI" },
  { from: "semarang",     to: "surabaya",     h: 4.0,  type: "conv", line: "KAI Argo Anggrek",           op: "PT KAI" },
  { from: "cirebon",      to: "yogyakarta",   h: 5.0,  type: "conv", line: "KAI Argo Lawu",              op: "PT KAI" },

  // ==========  PAKISTAN intermediates  ==========
  { from: "multan",       to: "bahawalpur",   h: 1.5,  type: "conv", line: "Karachi Express",            op: "Pakistan Railways" },
  { from: "bahawalpur",   to: "sukkur",       h: 4.0,  type: "conv", line: "Karachi Express",            op: "Pakistan Railways" },
  { from: "lahore",       to: "sahiwal",      h: 2.0,  type: "conv", line: "Awam Express",               op: "Pakistan Railways" },
  { from: "sahiwal",      to: "multan",       h: 3.0,  type: "conv", line: "Awam Express",               op: "Pakistan Railways" },

  // ==========  BANGLADESH intermediate stop  ==========
  { from: "dhaka",        to: "comilla",      h: 2.5,  type: "conv", line: "Mahanagar Provati",          op: "Bangladesh Railway" },
  { from: "comilla",      to: "chittagong",   h: 4.5,  type: "conv", line: "Mahanagar Provati",          op: "Bangladesh Railway" },

  // ==========  IRAN intermediates  ==========
  { from: "isfahan",      to: "yazd",         h: 5.0,  type: "conv", line: "Tehran–Bandar Abbas",        op: "RAI" },
  { from: "yazd",         to: "kerman",       h: 5.0,  type: "conv", line: "Tehran–Kerman",              op: "RAI" },
  { from: "yazd",         to: "bandarabbas",  h: 11.0, type: "conv", line: "Tehran–Bandar Abbas",        op: "RAI" },

  // ==========  Patch: previously-orphan stations  ==========
  // Türkiye — Izmir, Gaziantep, Van; Azerbaijan — Ganja
  { from: "izmir",        to: "eskisehir",    h: 9.0,  type: "conv", line: "İzmir Mavi Treni",           op: "TCDD" },
  { from: "ankara",       to: "gaziantep",    h: 13.0, type: "conv", line: "Toros Express (via Adana)",  op: "TCDD" },
  { from: "ankara",       to: "van",          h: 27.0, type: "conv", line: "Doğu Express + Van ferry",   op: "TCDD" },
  { from: "baku",         to: "ganja",        h: 3.0,  type: "conv", line: "ADY express",                op: "Azerbaijan Railways" },

  // ==========  v0.5 route additions  ==========

  // CHINA conventional sleepers + Yunnan-Vietnam Railway + Hainan
  { from: "kunming",      to: "hekou_cn",     h: 11.0, type: "conv", line: "Yunnan–Vietnam Railway K6/K6",op: "China Railway" },
  { from: "hekou_cn",     to: "laocai",       h: 0.5,  type: "conv", line: "Hekou–Lào Cai border",       op: "CR / VR" },
  { from: "beijing",      to: "hongkong",     h: 22.0, type: "conv", line: "Z97 Beijing–Kowloon (Jingjiu)", op: "China Railway / MTR" },
  { from: "shanghai",     to: "chengdu",      h: 28.0, type: "conv", line: "T223 Yangtze sleeper",       op: "China Railway" },
  { from: "shanghai",     to: "kunming",      h: 36.0, type: "conv", line: "K181 sleeper",               op: "China Railway" },
  { from: "shanghai",     to: "hongkong",     h: 17.0, type: "conv", line: "Z99 Shanghai–Kowloon",       op: "China Railway / MTR" },
  { from: "beijing",      to: "lhasa",        h: 40.0, type: "conv", line: "Z21 Beijing–Lhasa",          op: "China Railway" },
  { from: "guangzhou",    to: "urumqi",       h: 48.0, type: "conv", line: "T194 Guangzhou–Urumqi",      op: "China Railway" },
  { from: "shanghai",     to: "wenzhou",      h: 3.5,  type: "hsr",  line: "Yongtaiwen HSR",             op: "China Railway" },
  { from: "wenzhou",      to: "fuzhou",       h: 2.0,  type: "hsr",  line: "Hangshen HSR",               op: "China Railway" },
  { from: "shanghai",     to: "ningbo",       h: 2.0,  type: "hsr",  line: "Hangyong HSR",               op: "China Railway" },
  { from: "ningbo",       to: "wenzhou",      h: 1.5,  type: "hsr",  line: "Yongtaiwen HSR",             op: "China Railway" },
  { from: "hangzhou",     to: "ningbo",       h: 1.0,  type: "hsr",  line: "Hangyong HSR",               op: "China Railway" },
  { from: "wuhan",        to: "yichang",      h: 2.0,  type: "hsr",  line: "Hanyi HSR",                  op: "China Railway" },
  { from: "yichang",      to: "chongqing",    h: 5.0,  type: "conv", line: "Yiwan + Yulin",              op: "China Railway" },
  { from: "yichang",      to: "chengdu",      h: 6.0,  type: "conv", line: "Yiwan",                      op: "China Railway" },
  { from: "wuhan",        to: "jiujiang",     h: 1.5,  type: "hsr",  line: "Wuhan–Jiujiang",             op: "China Railway" },
  { from: "jiujiang",     to: "nanchang",     h: 1.0,  type: "hsr",  line: "Wujiu HSR",                  op: "China Railway" },
  { from: "huaihua",      to: "guiyang",      h: 2.5,  type: "hsr",  line: "Hukun HSR",                  op: "China Railway" },
  { from: "huaihua",      to: "changsha",     h: 1.5,  type: "hsr",  line: "Hukun HSR",                  op: "China Railway" },
  { from: "tongren",      to: "huaihua",      h: 1.0,  type: "hsr",  line: "Tonghuai HSR",               op: "China Railway" },
  { from: "guangzhou",    to: "haikou",       h: 7.0,  type: "conv", line: "Y447 Guangdong–Hainan ferry",op: "China Railway" },
  { from: "haikou",       to: "sanya",        h: 1.5,  type: "hsr",  line: "Hainan Eastern HSR",         op: "China Railway" },
  { from: "haikou",       to: "zhanjiang",    h: 4.0,  type: "conv", line: "Yuehai ferry crossing",      op: "China Railway" },
  { from: "zhanjiang",    to: "nanning",      h: 3.0,  type: "hsr",  line: "Nanguang/Zhanjiang HSR",     op: "China Railway" },
  { from: "zhanjiang",    to: "guangzhou",    h: 4.0,  type: "conv", line: "Y447 mainline",              op: "China Railway" },

  // INDIA — additional trunk + connector routes
  { from: "delhi",        to: "agra",         h: 2.0,  type: "conv", line: "Gatimaan / Vande Bharat",    op: "Indian Railways" },
  { from: "agra",         to: "gwalior",      h: 1.5,  type: "conv", line: "Bhopal Shatabdi",            op: "Indian Railways" },
  { from: "gwalior",      to: "jhansi",       h: 1.5,  type: "conv", line: "Bhopal Shatabdi",            op: "Indian Railways" },
  { from: "jhansi",       to: "bhopal",       h: 4.5,  type: "conv", line: "Bhopal Shatabdi",            op: "Indian Railways" },
  { from: "bhopal",       to: "itarsi",       h: 1.5,  type: "conv", line: "GT Express",                 op: "Indian Railways" },
  { from: "itarsi",       to: "nagpur",       h: 6.0,  type: "conv", line: "GT Express",                 op: "Indian Railways" },
  { from: "lucknow",      to: "kanpur",       h: 1.5,  type: "conv", line: "Vande Bharat",               op: "Indian Railways" },
  { from: "kanpur",       to: "prayagraj",    h: 3.5,  type: "conv", line: "Vande Bharat",               op: "Indian Railways" },
  { from: "delhi",        to: "kanpur",       h: 5.0,  type: "conv", line: "Shram Shakti / Vande Bharat",op: "Indian Railways" },
  { from: "hyderabad_in", to: "secunderabad", h: 0.25, type: "conv", line: "MMTS",                       op: "Indian Railways" },
  { from: "secunderabad", to: "vijayawada",   h: 4.5,  type: "conv", line: "Godavari Express",           op: "Indian Railways" },
  { from: "secunderabad", to: "nagpur",       h: 9.0,  type: "conv", line: "Krishna Express",            op: "Indian Railways" },
  { from: "chennai",      to: "katpadi",      h: 2.0,  type: "conv", line: "Bangalore Mail",             op: "Indian Railways" },
  { from: "katpadi",      to: "bangalore",    h: 3.0,  type: "conv", line: "Bangalore Mail",             op: "Indian Railways" },
  { from: "chennai",      to: "tiruchirapalli",h: 5.5, type: "conv", line: "Rockfort Express",           op: "Indian Railways" },
  { from: "tiruchirapalli",to: "madurai",     h: 2.5,  type: "conv", line: "Vaigai Express",             op: "Indian Railways" },
  { from: "mumbai",       to: "howrah",       h: 30.0, type: "conv", line: "Mumbai Mail (via Allahabad)",op: "Indian Railways" },
  { from: "delhi",        to: "guwahati",     h: 27.0, type: "conv", line: "Rajdhani 12423",             op: "Indian Railways" },

  // PAKISTAN — Khyber + Pakhtunkhwa filler
  { from: "rawalpindi",   to: "faisalabad",   h: 5.0,  type: "conv", line: "Karakoram branch",           op: "Pakistan Railways" },

  // KOREA — additional KTX lines
  { from: "daejeon",      to: "pohang",       h: 1.5,  type: "hsr",  line: "KTX Donghae",                op: "Korail" },

  // IRAN — connector to Pakistan border (Zahedan currently freight-only; skip).
  // West Asia
  { from: "ankara",       to: "adana",        h: 11.0, type: "conv", line: "Toros Express",              op: "TCDD" },
  { from: "adana",        to: "mersin",       h: 0.75, type: "conv", line: "Adana–Mersin commuter",      op: "TCDD" },
  { from: "adana",        to: "gaziantep",    h: 3.5,  type: "conv", line: "Toros Express",              op: "TCDD" },
  { from: "konya",        to: "adana",        h: 5.0,  type: "conv", line: "Toros Express",              op: "TCDD" },

  // RUSSIA — Volga + Trans-Sib branches
  // Moscow–Nizhny Novgorod Sapsan already declared above in the Trans-Sib section.
  { from: "nnovgorod",    to: "kazan",        h: 6.0,  type: "conv", line: "Kazan branch",               op: "RZD" },
  { from: "kazan",        to: "samara",       h: 13.0, type: "conv", line: "Kuibyshev Railway",          op: "RZD" },
  { from: "samara",       to: "ufa",          h: 8.0,  type: "conv", line: "Kuibyshev Railway",          op: "RZD" },
  { from: "ufa",          to: "yekaterinburg",h: 9.0,  type: "conv", line: "Kuibyshev mainline",         op: "RZD" },

  // KAZAKHSTAN — Petropavl + Kyzylorda intermediates
  { from: "astana",       to: "petropavl",    h: 5.0,  type: "conv", line: "Talgo / Tulpar",             op: "KTZ" },
  { from: "almaty",       to: "kyzylorda",    h: 18.0, type: "conv", line: "Mangyshlak",                 op: "KTZ" },
  { from: "kyzylorda",    to: "aktobe",       h: 18.0, type: "conv", line: "Mangyshlak",                 op: "KTZ" },

  // ==========  v0.6 ADDITIONS — Russia expansion + China HSR intermediates  ==========

  // RUSSIA — European core + South + Volga + Far East branches
  { from: "moscow",       to: "stpetersburg", h: 4.0,  type: "hsr",  line: "Sapsan (HSR Moscow–SPb)",    op: "RZD" },
  { from: "moscow",       to: "tula",         h: 2.0,  type: "conv", line: "Lastochka commuter+",        op: "RZD" },
  { from: "tula",         to: "kursk",        h: 3.5,  type: "conv", line: "Tula–Kursk",                 op: "RZD" },
  { from: "kursk",        to: "belgorod",     h: 2.0,  type: "conv", line: "Kursk–Belgorod",             op: "RZD" },
  { from: "moscow",       to: "voronezh",     h: 7.0,  type: "conv", line: "Voronezh Express",           op: "RZD" },
  { from: "voronezh",     to: "rostov_don",   h: 11.0, type: "conv", line: "Voronezh–Rostov",            op: "RZD" },
  { from: "voronezh",     to: "belgorod",     h: 4.0,  type: "conv", line: "Voronezh–Belgorod",          op: "RZD" },
  { from: "rostov_don",   to: "krasnodar",    h: 5.0,  type: "conv", line: "North Caucasus Railway",     op: "RZD" },
  { from: "krasnodar",    to: "sochi",        h: 4.0,  type: "conv", line: "Lastochka coastal",          op: "RZD" },
  { from: "rostov_don",   to: "sochi",        h: 9.0,  type: "conv", line: "Coastal corridor",           op: "RZD" },
  { from: "rostov_don",   to: "volgograd",    h: 10.0, type: "conv", line: "Volgograd line",             op: "RZD" },
  { from: "moscow",       to: "volgograd",    h: 16.0, type: "conv", line: "Volgograd Express (sleeper)",op: "RZD" },
  { from: "volgograd",    to: "astrakhan",    h: 8.0,  type: "conv", line: "Astrakhan branch",           op: "RZD" },
  { from: "volgograd",    to: "saratov",      h: 7.0,  type: "conv", line: "Volga line",                 op: "RZD" },
  { from: "saratov",      to: "penza",        h: 6.0,  type: "conv", line: "Volga line",                 op: "RZD" },
  { from: "penza",        to: "samara",       h: 8.0,  type: "conv", line: "Kuibyshev mainline",         op: "RZD" },
  { from: "saratov",      to: "samara",       h: 7.5,  type: "conv", line: "Samara–Saratov",             op: "RZD" },
  { from: "saratov",      to: "ulyanovsk",    h: 8.0,  type: "conv", line: "Volga branch",               op: "RZD" },
  { from: "ulyanovsk",    to: "kazan",        h: 5.0,  type: "conv", line: "Volga branch",               op: "RZD" },
  { from: "samara",       to: "ulyanovsk",    h: 4.0,  type: "conv", line: "Volga branch",               op: "RZD" },
  { from: "moscow",       to: "kursk",        h: 7.0,  type: "conv", line: "Kursk Express",              op: "RZD" },
  { from: "moscow",       to: "bryansk",      h: 4.0,  type: "conv", line: "Bryansk Express",            op: "RZD" },
  { from: "moscow",       to: "smolensk",     h: 4.0,  type: "conv", line: "Smolensk Express",           op: "RZD" },
  { from: "moscow",       to: "vladimir_ru",  h: 1.7,  type: "conv", line: "Strizh / Lastochka",         op: "RZD" },
  { from: "vladimir_ru",  to: "nnovgorod",    h: 2.5,  type: "conv", line: "Strizh / Lastochka",         op: "RZD" },
  { from: "moscow",       to: "yaroslavl",    h: 3.5,  type: "conv", line: "Yaroslavl Lastochka",        op: "RZD" },
  { from: "yaroslavl",    to: "vologda",      h: 4.0,  type: "conv", line: "Vologda branch",             op: "RZD" },
  { from: "vologda",      to: "stpetersburg", h: 12.0, type: "conv", line: "Vologda–SPb",                op: "RZD" },
  // (Moscow–SPb Sapsan declared earlier under European core.)
  // Trans-Siberian fillers
  { from: "novosibirsk",  to: "tomsk",        h: 4.0,  type: "conv", line: "Tomsk branch",               op: "RZD" },
  { from: "novosibirsk",  to: "barnaul",      h: 4.0,  type: "conv", line: "Talgo Barnaul",              op: "RZD" },
  // Far East — BAM
  { from: "khabarovsk",   to: "komsomolsk",   h: 9.0,  type: "conv", line: "Baikal–Amur Mainline",       op: "RZD" },
  { from: "komsomolsk",   to: "sov_gavan",    h: 18.0, type: "conv", line: "BAM (Vanino branch)",        op: "RZD" },
  { from: "vladivostok",  to: "nakhodka",     h: 3.0,  type: "conv", line: "Vladivostok–Nakhodka",       op: "RZD" },

  // CHINA — more HSR intermediates the user keeps flagging
  // Jinghu HSR intermediates between Nanjing and Wuxi
  { from: "nanjing",      to: "zhenjiang",    h: 0.25, type: "hsr",  line: "Jinghu HSR",                 op: "China Railway" },
  { from: "zhenjiang",    to: "changzhou",    h: 0.3,  type: "hsr",  line: "Jinghu HSR",                 op: "China Railway" },
  { from: "changzhou",    to: "wuxi",         h: 0.2,  type: "hsr",  line: "Jinghu HSR",                 op: "China Railway" },
  // Beijing–Harbin (Jingha) — Tangshan between Beijing and Qinhuangdao
  { from: "beijing",      to: "tangshan",     h: 0.75, type: "hsr",  line: "Jingha HSR (Jingshen)",      op: "China Railway" },
  { from: "tangshan",     to: "qinhuangdao",  h: 0.8,  type: "hsr",  line: "Jingha HSR",                 op: "China Railway" },
  // Longhai HSR — Zhengzhou-Kaifeng-Luoyang-Xi'an
  { from: "zhengzhou",    to: "kaifeng",      h: 0.4,  type: "hsr",  line: "Zhengkai Intercity",         op: "China Railway" },
  { from: "zhengzhou",    to: "luoyang",      h: 0.6,  type: "hsr",  line: "Zhengxi HSR",                op: "China Railway" },
  { from: "luoyang",      to: "xian",         h: 1.5,  type: "hsr",  line: "Zhengxi HSR",                op: "China Railway" },
  // Hangshen + Yongtaiwen — Shaoxing between Hangzhou and Ningbo
  { from: "hangzhou",     to: "shaoxing",     h: 0.4,  type: "hsr",  line: "Hangyong HSR",               op: "China Railway" },
  { from: "shaoxing",     to: "ningbo",       h: 0.6,  type: "hsr",  line: "Hangyong HSR",               op: "China Railway" },
  // Yancheng + Nantong on the Jiangsu coastal HSR
  { from: "nantong",      to: "shanghai",     h: 1.25, type: "hsr",  line: "Hutong HSR",                 op: "China Railway" },
  { from: "yancheng",     to: "nantong",      h: 1.5,  type: "hsr",  line: "Yantong HSR",                op: "China Railway" },
  { from: "yancheng",     to: "nanjing",      h: 1.75, type: "hsr",  line: "Yanlian HSR",                op: "China Railway" },
  // Ganzhou (Jingjiu HSR) + Jingdezhen (Hangchang HSR)
  { from: "nanchang",     to: "jingdezhen",   h: 1.0,  type: "hsr",  line: "Hangchang HSR",              op: "China Railway" },
  { from: "jingdezhen",   to: "hangzhou",     h: 2.0,  type: "hsr",  line: "Hangchang HSR",              op: "China Railway" },
  { from: "nanchang",     to: "wuxi_east",    h: 1.0,  type: "hsr",  line: "Changji HSR",                op: "China Railway" },
  { from: "ganzhou",      to: "nanchang",     h: 2.0,  type: "hsr",  line: "Changgan HSR",               op: "China Railway" },
  { from: "ganzhou",      to: "shenzhen",     h: 2.0,  type: "hsr",  line: "Ganshen HSR",                op: "China Railway" },

  // INDIA more intermediates
  { from: "delhi",        to: "ghaziabad",    h: 0.5,  type: "conv", line: "Delhi suburban",             op: "Indian Railways" },
  { from: "ghaziabad",    to: "aligarh",      h: 1.5,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "aligarh",      to: "tundla",       h: 1.0,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "tundla",       to: "etawah",       h: 1.5,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "etawah",       to: "kanpur",       h: 2.0,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "tundla",       to: "agra",         h: 0.5,  type: "conv", line: "Agra Cantt branch",          op: "Indian Railways" },
  { from: "kharagpur",    to: "howrah",       h: 1.75, type: "conv", line: "South Eastern mainline",    op: "Indian Railways" },
  { from: "kharagpur",    to: "bhubaneswar",  h: 5.0,  type: "conv", line: "Coromandel Express",         op: "Indian Railways" },

  // VIETNAM intermediate
  { from: "hanoi",        to: "ninhbinh",     h: 2.5,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },
  { from: "ninhbinh",     to: "thanhhoa",     h: 1.5,  type: "conv", line: "Reunification Express",      op: "Vietnam Railways" },

  // ==========  v0.8 — Sabah, Sumatra, NK east coast, Trans-Sib southern  ==========

  // MALAYSIA — Sabah State Railway (separate island component)
  { from: "kotakinabalu", to: "beaufort_my",  h: 2.0,  type: "conv", line: "Sabah State Railway",        op: "JKNS" },
  { from: "beaufort_my",  to: "tenom",        h: 2.0,  type: "conv", line: "Sabah State Railway (Padas)",op: "JKNS" },

  // INDONESIA — Sumatra rail (three separate non-connected island sub-networks)
  { from: "medan",        to: "tebingtinggi", h: 2.5,  type: "conv", line: "Sribilah / Sumut Express",   op: "PT KAI Divre I" },
  { from: "tebingtinggi", to: "siantar",      h: 1.5,  type: "conv", line: "Siantar Express",            op: "PT KAI Divre I" },
  // Padang sits alone on the West Sumatra branch (Pulau Aie–Sawahlunto historical, now Padang–Pariaman only)
  // No reliable through service to other Sumatra networks — kept as its own component.
  { from: "palembang",    to: "lampung",      h: 9.0,  type: "conv", line: "Rajabasa Sriwijaya",         op: "PT KAI Divre IV" },

  // NORTH KOREA — east coast P'yŏngra Line + Hamgyong Line
  { from: "wonsan",       to: "hamhung",      h: 4.0,  type: "conv", line: "P'yŏngra Line",              op: "Korean State Railway" },
  { from: "hamhung",      to: "chongjin",     h: 9.0,  type: "conv", line: "P'yŏngra Line (north)",      op: "Korean State Railway" },
  { from: "chongjin",     to: "rason",        h: 4.0,  type: "conv", line: "Hamgyong Line",              op: "Korean State Railway" },

  // RUSSIA – NORTH KOREA — Khasan / Tumangang Friendship Bridge
  { from: "rason",        to: "khasan",       h: 1.5,  type: "conv", line: "Khasan–Tumangang Friendship Bridge", op: "KSR / RZD" },
  { from: "khasan",       to: "vladivostok",  h: 7.0,  type: "conv", line: "RZD Khasan branch",          op: "RZD" },

  // KAZAKHSTAN ↔ RUSSIA — classic Trans-Siberian southern routing via Petropavl
  { from: "petropavl",    to: "omsk",         h: 4.0,  type: "conv", line: "Trans-Siberian (Kazakh stub)",op: "RZD / KTZ" },

  // ==========  v0.9 — more rail in CN Xinjiang, NE China, BAM, Caucasus link, Sri Lanka, Nepal, Japan extras  ==========
  // CHINA — Xinjiang south branch (Urumqi–Kashgar–Hotan)
  { from: "turpan",       to: "korla",        h: 4.5,  type: "conv", line: "South Xinjiang Railway",     op: "China Railway" },
  { from: "korla",        to: "aksu",         h: 5.5,  type: "conv", line: "South Xinjiang Railway",     op: "China Railway" },
  { from: "aksu",         to: "kashgar",      h: 6.0,  type: "conv", line: "South Xinjiang Railway",     op: "China Railway" },
  { from: "kashgar",      to: "hotan",        h: 7.5,  type: "conv", line: "Hotan Branch",                op: "China Railway" },
  // CHINA — Northeast extras
  { from: "harbin",       to: "qiqihar",      h: 1.5,  type: "hsr",  line: "Habai HSR",                  op: "China Railway" },
  { from: "harbin",       to: "mudanjiang",   h: 1.75, type: "hsr",  line: "Hamu HSR",                   op: "China Railway" },
  { from: "mudanjiang",   to: "yanji",        h: 3.0,  type: "conv", line: "Tumen Line",                 op: "China Railway" },
  { from: "changchun",    to: "yanji",        h: 2.5,  type: "hsr",  line: "Changhun HSR",               op: "China Railway" },

  // IRAN — Tehran western
  { from: "tehran",       to: "hamadan",      h: 5.0,  type: "conv", line: "Tehran–Hamadan",             op: "RAI" },
  { from: "hamadan",      to: "kermanshah",   h: 3.5,  type: "conv", line: "Hamadan–Kermanshah",         op: "RAI" },

  // SRI LANKA — Hill Country + east
  { from: "kandy",        to: "badulla",      h: 7.0,  type: "conv", line: "Main Line (Hill Country)",   op: "Sri Lanka Railways" },
  { from: "anuradhapura", to: "trinco",       h: 5.0,  type: "conv", line: "Trinco Line",                op: "Sri Lanka Railways" },

  // NEPAL — Jaynagar (IN) ↔ Janakpur (NP) (opened 2023)
  { from: "jaynagar",     to: "janakpur",     h: 1.0,  type: "conv", line: "Jaynagar–Janakpur",          op: "Nepal Railways" },
  { from: "patna",        to: "jaynagar",     h: 6.0,  type: "conv", line: "Mithila Express",            op: "Indian Railways" },

  // JAPAN — more Shinkansen stops
  { from: "nagoya",       to: "maibara",      h: 0.4,  type: "hsr",  line: "Tōkaidō Shinkansen",         op: "JR Central" },
  { from: "maibara",      to: "kyoto",        h: 0.25, type: "hsr",  line: "Tōkaidō Shinkansen",         op: "JR Central" },
  { from: "tokyo",        to: "utsunomiya",   h: 0.5,  type: "hsr",  line: "Tōhoku Shinkansen (Yamabiko)", op: "JR East" },
  { from: "utsunomiya",   to: "fukushima_jp", h: 0.7,  type: "hsr",  line: "Tōhoku Shinkansen",          op: "JR East" },
  { from: "fukushima_jp", to: "sendai",       h: 0.4,  type: "hsr",  line: "Tōhoku Shinkansen",          op: "JR East" },
  { from: "kanazawa",     to: "toyama",       h: 0.4,  type: "hsr",  line: "Hokuriku Shinkansen",        op: "JR West" },

  // RUSSIA — BAM interior
  { from: "tayshet",      to: "bratsk",       h: 7.0,  type: "conv", line: "Baikal–Amur Mainline",       op: "RZD" },
  { from: "bratsk",       to: "severobaikalsk",h: 15.0, type: "conv", line: "Baikal–Amur Mainline",       op: "RZD" },
  { from: "severobaikalsk",to: "tynda",       h: 28.0, type: "conv", line: "Baikal–Amur Mainline",       op: "RZD" },
  { from: "tynda",        to: "komsomolsk",   h: 38.0, type: "conv", line: "Baikal–Amur Mainline",       op: "RZD" },

  // RUSSIA ↔ AZERBAIJAN — Caspian corridor (Astrakhan → Makhachkala → Baku)
  { from: "astrakhan",    to: "makhachkala",  h: 13.0, type: "conv", line: "Caspian coastal",            op: "RZD" },
  { from: "makhachkala",  to: "baku",         h: 14.0, type: "conv", line: "Caspian / Yalama crossing",  op: "RZD / ADY" },

  // ==========  v0.10 missing-data routes  ==========
  // CHINA — Jiao-Ji (Jinan–Qingdao) + Suifenhe
  { from: "jinan",        to: "zibo",         h: 0.4,  type: "hsr",  line: "Jiqing HSR",                 op: "China Railway" },
  { from: "zibo",         to: "weifang",      h: 0.5,  type: "hsr",  line: "Jiqing HSR",                 op: "China Railway" },
  { from: "weifang",      to: "qingdao",      h: 0.6,  type: "hsr",  line: "Jiqing HSR",                 op: "China Railway" },
  { from: "mudanjiang",   to: "suifenhe",     h: 2.5,  type: "conv", line: "Suifenhe branch",            op: "China Railway" },
  // RUSSIA — Tula→Orel→Kursk + Sochi coast
  { from: "tula",         to: "orel",         h: 3.0,  type: "conv", line: "Kursk Express",              op: "RZD" },
  { from: "orel",         to: "kursk",        h: 2.5,  type: "conv", line: "Kursk Express",              op: "RZD" },
  { from: "krasnodar",    to: "tuapse",       h: 2.5,  type: "conv", line: "North Caucasus coastal",     op: "RZD" },
  { from: "tuapse",       to: "sochi",        h: 2.5,  type: "conv", line: "Black Sea coast",            op: "RZD" },
  // PAKISTAN — Sialkot + Gujranwala
  { from: "lahore",       to: "sialkot",      h: 2.5,  type: "conv", line: "Allama Iqbal Express",       op: "Pakistan Railways" },
  { from: "lahore",       to: "gujranwala",   h: 1.0,  type: "conv", line: "Karachi Express",            op: "Pakistan Railways" },
  { from: "gujranwala",   to: "rawalpindi",   h: 3.0,  type: "conv", line: "Karachi Express",            op: "Pakistan Railways" },
  // BANGLADESH — Northern
  { from: "rajshahi",     to: "bogra",        h: 2.5,  type: "conv", line: "Drutajan",                   op: "Bangladesh Railway" },
  { from: "dhaka",        to: "mymensingh",   h: 3.5,  type: "conv", line: "Tista Express",              op: "Bangladesh Railway" },
  // SRI LANKA — Hill country mid-stops + Polonnaruwa
  { from: "kandy",        to: "hatton",       h: 3.0,  type: "conv", line: "Main Line (Hill)",           op: "Sri Lanka Railways" },
  { from: "hatton",       to: "badulla",      h: 4.0,  type: "conv", line: "Main Line (Hill)",           op: "Sri Lanka Railways" },
  { from: "anuradhapura", to: "polonnaruwa",  h: 3.0,  type: "conv", line: "Trinco Line branch",         op: "Sri Lanka Railways" },
  // INDONESIA — Java east branch + Solo
  { from: "yogyakarta",   to: "solo",         h: 1.0,  type: "conv", line: "Prameks / Argo Lawu",        op: "PT KAI" },
  { from: "solo",         to: "surabaya",     h: 4.0,  type: "conv", line: "Argo Wilis / Bima",          op: "PT KAI" },
  { from: "surabaya",     to: "probolinggo",  h: 2.0,  type: "conv", line: "Mutiara Timur",              op: "PT KAI" },
  { from: "probolinggo",  to: "banyuwangi",   h: 5.0,  type: "conv", line: "Mutiara Timur",              op: "PT KAI" },
  // KOREA — KTX/SRT secondary cities
  { from: "cheonan_asan", to: "cheongju",     h: 0.5,  type: "conv", line: "Chungbuk Line",              op: "Korail" },
  { from: "seoul",        to: "wonju",        h: 1.0,  type: "hsr",  line: "KTX Gangneung",              op: "Korail" },
  { from: "seoul",        to: "jeonju",       h: 1.75, type: "hsr",  line: "KTX Honam (Jeolla)",         op: "Korail" },
  { from: "busan",        to: "ulsan",        h: 0.3,  type: "hsr",  line: "KTX Gyeongbu",               op: "Korail" },
  // IRAN — Mashhad intermediates + Hamadan
  { from: "tehran",       to: "semnan",       h: 3.0,  type: "conv", line: "Tehran–Mashhad",             op: "RAI" },
  { from: "semnan",       to: "shahrud",      h: 2.5,  type: "conv", line: "Tehran–Mashhad",             op: "RAI" },
  { from: "shahrud",      to: "mashhad",      h: 5.5,  type: "conv", line: "Tehran–Mashhad",             op: "RAI" },
  // TÜRKIYE — Doğu Express intermediates
  { from: "sivas",        to: "erzincan",     h: 6.0,  type: "conv", line: "Doğu Express",               op: "TCDD" },
  { from: "erzincan",     to: "erzurum",      h: 5.0,  type: "conv", line: "Doğu Express",               op: "TCDD" },
  { from: "erzurum",      to: "kars",         h: 5.0,  type: "conv", line: "Doğu Express",               op: "TCDD" },
  // MONGOLIA — east
  { from: "ulaanbaatar",  to: "choibalsan",   h: 24.0, type: "conv", line: "Choibalsan branch",          op: "UBTZ" },
  // CAMBODIA — northwestern
  { from: "poipet",       to: "battambang",   h: 3.0,  type: "conv", line: "Royal Railway Northern",     op: "Royal Railway Cambodia" },
  { from: "battambang",   to: "pursat",       h: 3.0,  type: "conv", line: "Royal Railway Northern",     op: "Royal Railway Cambodia" },
  { from: "pursat",       to: "phnompenh",    h: 5.0,  type: "conv", line: "Royal Railway Northern",     op: "Royal Railway Cambodia" },
  // MYANMAR — Pyay + Bagan
  { from: "yangon",       to: "pyay",         h: 8.0,  type: "conv", line: "Pyay Line",                  op: "Myanmar Railways" },
  { from: "mandalay",     to: "bagan",        h: 7.0,  type: "conv", line: "Mandalay–Bagan",             op: "Myanmar Railways" },
  // JAPAN — Tokyo metro + Tokaido extras
  { from: "tokyo",        to: "shinagawa",    h: 0.1,  type: "conv", line: "JR Yamanote",                op: "JR East" },
  { from: "shinagawa",    to: "yokohama",     h: 0.3,  type: "conv", line: "JR Keihin-Tōhoku",           op: "JR East" },
  { from: "yokohama",     to: "odawara",      h: 0.5,  type: "conv", line: "JR Tōkaidō",                 op: "JR East" },
  { from: "odawara",      to: "shizuoka",     h: 0.5,  type: "hsr",  line: "Tōkaidō Shinkansen (Kodama)",op: "JR Central" },
  // SAUDI — Riyadh ↔ Hail (Saudi Land Bridge)
  { from: "riyadh",       to: "qassim",       h: 3.0,  type: "conv", line: "SAR North line",             op: "SAR" },
  { from: "qassim",       to: "hail",         h: 3.0,  type: "conv", line: "SAR North line",             op: "SAR" },
  { from: "hail",         to: "medina",       h: 7.0,  type: "conv", line: "SAR North line",             op: "SAR" },
  // ARMENIA — Yerevan ↔ Gyumri
  { from: "yerevan",      to: "gyumri",       h: 3.0,  type: "conv", line: "Yerevan–Gyumri",             op: "SCR" },

  // ==========  v0.13 — routes for the new intermediates  ==========
  // CHINA — Jinghu/Huning intermediates + Wuhu/Anqing
  { from: "hangzhou",     to: "huzhou",       h: 0.5,  type: "hsr",  line: "Hugu HSR",                   op: "China Railway" },
  { from: "huzhou",       to: "nanjing",      h: 1.0,  type: "hsr",  line: "Ningqi/Hugu",                op: "China Railway" },
  { from: "nanjing",      to: "wuhu",         h: 0.75, type: "conv", line: "Ningwu Line",                op: "China Railway" },
  { from: "wuhu",         to: "anqing",       h: 1.0,  type: "hsr",  line: "Hewu HSR",                   op: "China Railway" },
  { from: "anqing",       to: "hefei",        h: 0.75, type: "hsr",  line: "Hefu HSR",                   op: "China Railway" },
  // Yangzhou + Taizhou (Jiangsu) on Ninghuai
  { from: "nanjing",      to: "yangzhou",     h: 1.0,  type: "conv", line: "Ninghuai",                   op: "China Railway" },
  { from: "yangzhou",     to: "taizhou_js",   h: 0.75, type: "conv", line: "Ninghuai",                   op: "China Railway" },
  { from: "taizhou_js",   to: "nantong",      h: 1.0,  type: "conv", line: "Ninghuai",                   op: "China Railway" },
  // Lianyungang on Coastal + Longhai
  { from: "xuzhou",       to: "lianyungang",  h: 1.0,  type: "hsr",  line: "Longhai mainline",           op: "China Railway" },
  { from: "lianyungang",  to: "yancheng",     h: 1.25, type: "hsr",  line: "Coastal HSR",                op: "China Railway" },
  // Hangshen south + Putian/Quanzhou/Shantou/Chaozhou
  { from: "hangzhou",     to: "yiwu",         h: 0.5,  type: "hsr",  line: "Hangchang HSR",              op: "China Railway" },
  { from: "yiwu",         to: "jinhua",       h: 0.3,  type: "hsr",  line: "Hangchang HSR",              op: "China Railway" },
  { from: "jinhua",       to: "wenzhou",      h: 1.5,  type: "hsr",  line: "Hangshen HSR",               op: "China Railway" },
  { from: "fuzhou",       to: "putian",       h: 0.6,  type: "hsr",  line: "Fuxia HSR",                  op: "China Railway" },
  { from: "putian",       to: "quanzhou",     h: 0.4,  type: "hsr",  line: "Fuxia HSR",                  op: "China Railway" },
  { from: "quanzhou",     to: "xiamen",       h: 0.6,  type: "hsr",  line: "Fuxia HSR",                  op: "China Railway" },
  { from: "xiamen",       to: "chaozhou",     h: 1.5,  type: "hsr",  line: "Xiashen HSR",                op: "China Railway" },
  { from: "chaozhou",     to: "shantou",      h: 0.4,  type: "hsr",  line: "Chaoshan",                   op: "China Railway" },
  { from: "shantou",      to: "shenzhen",     h: 1.75, type: "hsr",  line: "Xiashen HSR",                op: "China Railway" },
  { from: "guangzhou",    to: "huizhou",      h: 0.75, type: "hsr",  line: "Guanshen HSR",               op: "China Railway" },
  { from: "huizhou",      to: "shenzhen",     h: 0.5,  type: "hsr",  line: "Guanshen HSR",               op: "China Railway" },
  { from: "meizhou",      to: "shantou",      h: 1.5,  type: "conv", line: "Mei-Shan Railway",           op: "China Railway" },
  // Hukun + Guangxi
  { from: "guilin",       to: "liuzhou",      h: 1.0,  type: "hsr",  line: "Guigui HSR",                 op: "China Railway" },
  { from: "liuzhou",      to: "nanning",      h: 1.5,  type: "hsr",  line: "Liunan HSR",                 op: "China Railway" },
  { from: "guilin",       to: "guiyang",      h: 2.5,  type: "hsr",  line: "Guigui HSR",                 op: "China Railway" },
  { from: "nanning",      to: "beihai",       h: 1.5,  type: "hsr",  line: "Qingyu HSR",                 op: "China Railway" },
  { from: "nanning",      to: "yulin_gx",     h: 2.0,  type: "conv", line: "Liuwu Line",                 op: "China Railway" },
  // Chengdu south + Yunnan
  { from: "chengdu",      to: "leshan",       h: 1.0,  type: "hsr",  line: "Chengkun HSR",               op: "China Railway" },
  { from: "leshan",       to: "yibin",        h: 0.75, type: "conv", line: "Chengkun corridor",          op: "China Railway" },
  { from: "chongqing",    to: "neijiang",     h: 1.5,  type: "hsr",  line: "Chengyu HSR",                op: "China Railway" },
  { from: "neijiang",     to: "chengdu",      h: 1.0,  type: "hsr",  line: "Chengyu HSR",                op: "China Railway" },
  { from: "kunming",      to: "dali_cn",      h: 2.0,  type: "hsr",  line: "Dali Line",                  op: "China Railway" },
  { from: "dali_cn",      to: "lijiang",      h: 2.0,  type: "conv", line: "Dali–Lijiang",               op: "China Railway" },
  // Hewu + Jiujiang–Shangrao
  { from: "shangrao",     to: "hangzhou",     h: 1.5,  type: "hsr",  line: "Hangchang HSR",              op: "China Railway" },
  { from: "shangrao",     to: "nanchang",     h: 1.25, type: "hsr",  line: "Huku HSR",                   op: "China Railway" },
  // Hanyi extension to Xiangyang/Shiyan
  { from: "wuhan",        to: "xiangyang",    h: 2.0,  type: "conv", line: "Hanshi mainline",            op: "China Railway" },
  { from: "xiangyang",    to: "shiyan",       h: 1.5,  type: "conv", line: "Hanshi mainline",            op: "China Railway" },
  { from: "xiangyang",    to: "xian",         h: 4.5,  type: "conv", line: "Xikang corridor",            op: "China Railway" },
  // Xi'an north + Lan-Xin south
  { from: "lanzhou",      to: "tianshui",     h: 1.0,  type: "hsr",  line: "Baolan HSR",                 op: "China Railway" },
  { from: "tianshui",     to: "baoji",        h: 1.0,  type: "hsr",  line: "Baolan HSR",                 op: "China Railway" },
  { from: "baoji",        to: "xian",         h: 1.0,  type: "hsr",  line: "Xibao HSR",                  op: "China Railway" },
  { from: "xian",         to: "yanan",        h: 2.5,  type: "conv", line: "Xiyan Line",                 op: "China Railway" },
  { from: "yanan",        to: "yinchuan",     h: 7.0,  type: "conv", line: "Taizhongyin Line",           op: "China Railway" },
  { from: "yinchuan",     to: "lanzhou",      h: 5.0,  type: "conv", line: "Baolan branch",              op: "China Railway" },
  { from: "yinchuan",     to: "ordos",        h: 4.0,  type: "conv", line: "Baoyin Line",                op: "China Railway" },
  { from: "ordos",        to: "hohhot",       h: 2.5,  type: "hsr",  line: "Hubao HSR",                  op: "China Railway" },

  // INDIA — Central + East + South + West fillers
  { from: "nagpur",       to: "raipur",       h: 4.5,  type: "conv", line: "Howrah Mail",                op: "Indian Railways" },
  { from: "raipur",       to: "bilaspur",     h: 2.0,  type: "conv", line: "Howrah Mail",                op: "Indian Railways" },
  { from: "bilaspur",     to: "rourkela",     h: 4.5,  type: "conv", line: "Howrah Mail",                op: "Indian Railways" },
  { from: "rourkela",     to: "kharagpur",    h: 5.0,  type: "conv", line: "Howrah Mail",                op: "Indian Railways" },
  { from: "howrah",       to: "asansol",      h: 2.5,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "asansol",      to: "dhanbad",      h: 1.0,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "dhanbad",      to: "gaya",         h: 2.5,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "gaya",         to: "patna",        h: 2.5,  type: "conv", line: "Howrah Rajdhani",            op: "Indian Railways" },
  { from: "ratlam",       to: "indore",       h: 2.0,  type: "conv", line: "Avantika Express",           op: "Indian Railways" },
  { from: "indore",       to: "bhopal",       h: 4.5,  type: "conv", line: "Intercity",                  op: "Indian Railways" },
  { from: "nagpur",       to: "akola",        h: 4.0,  type: "conv", line: "Sevagram Express",           op: "Indian Railways" },
  { from: "akola",        to: "pune",         h: 11.0, type: "conv", line: "Mumbai Mail (via Manmad)",   op: "Indian Railways" },
  { from: "pune",         to: "solapur",      h: 5.0,  type: "conv", line: "Hyderabad Express",          op: "Indian Railways" },
  { from: "solapur",      to: "hyderabad_in", h: 7.0,  type: "conv", line: "Hyderabad Express",          op: "Indian Railways" },
  { from: "pune",         to: "kolhapur",     h: 8.0,  type: "conv", line: "Mahalaxmi Express",          op: "Indian Railways" },
  { from: "chennai",      to: "tirupati",     h: 3.0,  type: "conv", line: "Tirupati Express",           op: "Indian Railways" },
  { from: "jaipur",       to: "ajmer",        h: 2.0,  type: "conv", line: "Vande Bharat",               op: "Indian Railways" },
  { from: "ajmer",        to: "jodhpur",      h: 4.5,  type: "conv", line: "Ranikhet Express",           op: "Indian Railways" },
  { from: "ajmer",        to: "udaipur",      h: 5.0,  type: "conv", line: "Mewar Express",              op: "Indian Railways" },

  // RUSSIA
  { from: "moscow",       to: "tver",         h: 1.5,  type: "hsr",  line: "Sapsan",                     op: "RZD" },
  { from: "tver",         to: "stpetersburg", h: 2.5,  type: "hsr",  line: "Sapsan",                     op: "RZD" },
  { from: "stpetersburg", to: "vyborg",       h: 1.5,  type: "conv", line: "Lastochka",                  op: "RZD" },
  { from: "stpetersburg", to: "petrozavodsk", h: 5.0,  type: "conv", line: "Murmansk corridor",          op: "RZD" },
  { from: "petrozavodsk", to: "murmansk",     h: 18.0, type: "conv", line: "Arktika sleeper",            op: "RZD" },
  { from: "perm",         to: "izhevsk",      h: 7.0,  type: "conv", line: "Kazan–Yekat branch",         op: "RZD" },
  { from: "samara",       to: "orenburg",     h: 8.0,  type: "conv", line: "Orenburg branch",            op: "RZD" },
  { from: "makhachkala",  to: "minvody",      h: 8.0,  type: "conv", line: "Caucasus mainline",          op: "RZD" },
  { from: "minvody",      to: "rostov_don",   h: 11.0, type: "conv", line: "Caucasus mainline",          op: "RZD" },

  // JAPAN
  { from: "fukushima_jp", to: "yamagata",     h: 1.0,  type: "hsr",  line: "Yamagata Shinkansen",        op: "JR East" },
  { from: "morioka",      to: "akita",        h: 1.6,  type: "hsr",  line: "Akita Shinkansen",           op: "JR East" },
  { from: "tokyo",        to: "shinyokohama", h: 0.2,  type: "hsr",  line: "Tōkaidō Shinkansen",         op: "JR Central" },
  { from: "shinyokohama", to: "shizuoka",     h: 0.55, type: "hsr",  line: "Tōkaidō Shinkansen",         op: "JR Central" },
  { from: "hakata",       to: "kokura",       h: 0.25, type: "hsr",  line: "San'yō Shinkansen",          op: "JR West" },
  { from: "kokura",       to: "kumamoto",     h: 0.8,  type: "hsr",  line: "Kyūshū Shinkansen",          op: "JR Kyushu" },

  // KOREA
  { from: "seoul",        to: "incheon",      h: 0.5,  type: "conv", line: "Gyeongin/Airport",           op: "Korail / AREX" },

  // TÜRKIYE
  { from: "eskisehir",    to: "afyon",        h: 1.0,  type: "hsr",  line: "YHT",                        op: "TCDD" },
  { from: "afyon",        to: "konya",        h: 1.0,  type: "hsr",  line: "YHT",                        op: "TCDD" },

  // KAZAKHSTAN
  { from: "astana",       to: "karaganda",    h: 3.0,  type: "conv", line: "Tulpar / Talgo",             op: "KTZ" },
  { from: "karaganda",    to: "almaty",       h: 10.5, type: "conv", line: "Tulpar",                     op: "KTZ" },

  // INDONESIA
  { from: "cirebon",      to: "tegal",        h: 1.5,  type: "conv", line: "Argo Cheribon",              op: "PT KAI" },
  { from: "tegal",        to: "semarang",     h: 2.0,  type: "conv", line: "Argo Sindoro",               op: "PT KAI" },
  { from: "surabaya",     to: "malang",       h: 2.0,  type: "conv", line: "Penataran",                  op: "PT KAI" },
];

// =============================================================
// COUNTRY LOOKUP
// =============================================================
window.COUNTRY_NAMES = {
  CN: "China", HK: "Hong Kong SAR", MO: "Macau SAR",
  MN: "Mongolia", RU: "Russia",
  KP: "North Korea", KR: "South Korea", JP: "Japan", TW: "Taiwan",
  VN: "Vietnam", LA: "Laos", KH: "Cambodia", TH: "Thailand",
  MM: "Myanmar", MY: "Malaysia", SG: "Singapore", ID: "Indonesia",
  PH: "Philippines", BN: "Brunei", TL: "Timor-Leste",
  IN: "India", BD: "Bangladesh", PK: "Pakistan", LK: "Sri Lanka",
  NP: "Nepal", BT: "Bhutan", MV: "Maldives",
  AF: "Afghanistan",
  KZ: "Kazakhstan", UZ: "Uzbekistan", TM: "Turkmenistan",
  KG: "Kyrgyzstan", TJ: "Tajikistan",
  IR: "Iran", TR: "Türkiye",
  GE: "Georgia", AM: "Armenia", AZ: "Azerbaijan",
  IL: "Israel", PS: "Palestine", LB: "Lebanon", JO: "Jordan",
  SY: "Syria", IQ: "Iraq", SA: "Saudi Arabia",
  AE: "UAE", OM: "Oman", YE: "Yemen", QA: "Qatar",
  BH: "Bahrain", KW: "Kuwait", CY: "Cyprus",
};

// Region grouping (for dropdown optgroups). Order matters.
window.REGIONS = [
  { name: "North Asia",     codes: ["RU"] },
  { name: "East Asia",      codes: ["CN", "HK", "TW", "MN", "KP", "KR", "JP"] },
  { name: "Southeast Asia", codes: ["VN", "LA", "KH", "TH", "MM", "MY", "SG", "ID"] },
  { name: "South Asia",     codes: ["IN", "BD", "PK", "LK"] },
  { name: "Central Asia",   codes: ["KZ", "UZ", "TM", "TJ", "KG"] },
  { name: "West Asia",      codes: ["IR", "IQ", "TR", "GE", "AM", "AZ", "IL", "SA", "AE"] },
];

// ISO numeric IDs (as used by world-atlas) of countries with no
// regular scheduled intercity passenger rail. These get hatched on the map.
window.HATCH_COUNTRY_IDS = new Set([
  "004", // Afghanistan
  "048", // Bahrain
  "064", // Bhutan
  "096", // Brunei
  "196", // Cyprus
  "275", // Palestine
  "400", // Jordan (Hejaz heritage only)
  "414", // Kuwait
  "422", // Lebanon (suspended)
  "446", // Macao
  "462", // Maldives
  "512", // Oman
  "524", // Nepal (only one short cross-border line)
  "598", // Papua New Guinea
  "608", // Philippines (commuter only, no intercity)
  "626", // Timor-Leste
  "634", // Qatar
  "760", // Syria (war-disrupted)
  "887", // Yemen
  // Removed: Iraq (IRR Baghdad–Basra sleeper still runs), Kyrgyzstan
  // (Bishkek–Balykchy summer service to Issyk-Kul), UAE (Etihad Rail
  // Hafeet Express passenger service running Abu Dhabi–Fujairah).
]);

window.STATIONS_BY_ID = Object.fromEntries(window.STATIONS.map(s => [s.id, s]));
