// Popular phone models organized by brand name

export const PHONE_MODELS: Record<string, string[]> = {
    Samsung: [
        // Galaxy A series
        'Galaxy A05', 'Galaxy A05s', 'Galaxy A14', 'Galaxy A14 5G',
        'Galaxy A15', 'Galaxy A15 5G', 'Galaxy A16', 'Galaxy A16 5G',
        'Galaxy A25', 'Galaxy A25 5G', 'Galaxy A34', 'Galaxy A35',
        'Galaxy A54', 'Galaxy A55', 'Galaxy A73',
        // Galaxy S series
        'Galaxy S22', 'Galaxy S22+', 'Galaxy S22 Ultra',
        'Galaxy S23', 'Galaxy S23+', 'Galaxy S23 Ultra',
        'Galaxy S24', 'Galaxy S24+', 'Galaxy S24 Ultra',
        // Galaxy M series
        'Galaxy M14', 'Galaxy M15', 'Galaxy M34', 'Galaxy M35',
        // Galaxy Note
        'Galaxy Note 20', 'Galaxy Note 20 Ultra',
        // Galaxy Z
        'Galaxy Z Fold 5', 'Galaxy Z Flip 5', 'Galaxy Z Fold 6', 'Galaxy Z Flip 6',
        // Older
        'Galaxy A32', 'Galaxy A52', 'Galaxy A52s', 'Galaxy A53',
        'Galaxy A12', 'Galaxy A22', 'Galaxy A03s', 'Galaxy A04s',
    ],
    Apple: [
        'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
        'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
        'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
        'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 mini', 'iPhone 13',
        'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 mini', 'iPhone 12',
        'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
        'iPhone SE (3ra gen)', 'iPhone SE (2da gen)',
        'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
        'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
    ],
    Motorola: [
        // Moto G Power
        'Moto G Power 5G (2024)', 'Moto G Power (2023)', 'Moto G Power 5G (2023)',
        // Moto G
        'Moto G84', 'Moto G73', 'Moto G72', 'Moto G62', 'Moto G54',
        'Moto G53', 'Moto G52', 'Moto G42', 'Moto G32', 'Moto G22',
        'Moto G14', 'Moto G04', 'Moto G13', 'Moto G23',
        // Moto Edge
        'Moto Edge 50 Ultra', 'Moto Edge 50 Pro', 'Moto Edge 50',
        'Moto Edge 40 Pro', 'Moto Edge 40', 'Moto Edge 30 Ultra',
        // Razr
        'Razr 50 Ultra', 'Razr 50', 'Razr 40 Ultra', 'Razr 40',
        // Older
        'Moto G200', 'Moto G100', 'Moto E13', 'Moto E22', 'Moto E32',
    ],
    Xiaomi: [
        // Redmi Note
        'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
        'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12',
        'Redmi Note 11 Pro+', 'Redmi Note 11 Pro', 'Redmi Note 11',
        'Redmi Note 10 Pro', 'Redmi Note 10',
        // Redmi
        'Redmi 13', 'Redmi 12', 'Redmi 12C', 'Redmi 10C', 'Redmi A3', 'Redmi A2+',
        // Xiaomi (flagship)
        'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14',
        'Xiaomi 13 Ultra', 'Xiaomi 13 Pro', 'Xiaomi 13',
        // POCO
        'POCO X6 Pro', 'POCO X6', 'POCO X5 Pro', 'POCO X5',
        'POCO F6 Pro', 'POCO F6', 'POCO M6 Pro', 'POCO M6',
        'POCO C65', 'POCO C55',
    ],
    Huawei: [
        // P series
        'P60 Pro', 'P60', 'P50 Pro', 'P50', 'P40 Pro+', 'P40 Pro', 'P40',
        'P30 Pro', 'P30', 'P20 Pro', 'P20',
        // Mate series
        'Mate 60 Pro+', 'Mate 60 Pro', 'Mate 60', 'Mate 50 Pro', 'Mate 50',
        'Mate 40 Pro', 'Mate 40', 'Mate 30 Pro', 'Mate 30',
        // Nova series
        'Nova 12 Pro', 'Nova 12', 'Nova 11 Pro', 'Nova 11',
        'Nova Y91', 'Nova Y70', 'Nova Y61',
        // Y series
        'Y90', 'Y70', 'Y61',
    ],
    Nokia: [
        'Nokia G42', 'Nokia G21', 'Nokia G11', 'Nokia G10',
        'Nokia C32', 'Nokia C22', 'Nokia C12', 'Nokia C02',
        'Nokia X30', 'Nokia X20', 'Nokia X10',
        'Nokia 5.4', 'Nokia 3.4', 'Nokia 2.4',
        'Nokia 105', 'Nokia 106', 'Nokia 110', 'Nokia 130',
    ],
    Sony: [
        'Xperia 1 VI', 'Xperia 1 V', 'Xperia 1 IV',
        'Xperia 5 VI', 'Xperia 5 V', 'Xperia 5 IV',
        'Xperia 10 VI', 'Xperia 10 V', 'Xperia 10 IV',
        'Xperia Ace III',
    ],
    LG: [
        'LG Velvet', 'LG Wing', 'LG V60 ThinQ', 'LG V50 ThinQ',
        'LG G8 ThinQ', 'LG G7 ThinQ', 'LG Q70', 'LG K62', 'LG K52',
        'LG K42', 'LG K31', 'LG K22', 'LG Stylo 6', 'LG Stylo 5',
    ],
    OnePlus: [
        'OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 10 Pro',
        'OnePlus 10T', 'OnePlus 9 Pro', 'OnePlus 9', 'OnePlus 8 Pro',
        'OnePlus Nord 4', 'OnePlus Nord CE4', 'OnePlus Nord CE 3',
        'OnePlus Nord N30', 'OnePlus Nord N20',
    ],
    OPPO: [
        'OPPO Find X7 Ultra', 'OPPO Find X7', 'OPPO Find X6 Pro',
        'OPPO Reno 12 Pro', 'OPPO Reno 12', 'OPPO Reno 11 Pro', 'OPPO Reno 11',
        'OPPO Reno 10 Pro+', 'OPPO Reno 10', 'OPPO Reno 8 Pro',
        'OPPO A79', 'OPPO A78', 'OPPO A58', 'OPPO A38', 'OPPO A18',
    ],
    Vivo: [
        'Vivo X100 Pro', 'Vivo X100', 'Vivo X90 Pro', 'Vivo X90',
        'Vivo V30 Pro', 'Vivo V30', 'Vivo V29 Pro', 'Vivo V29',
        'Vivo Y200 Pro', 'Vivo Y200', 'Vivo Y100', 'Vivo Y36',
        'Vivo Y27', 'Vivo Y17s', 'Vivo Y16',
    ],
    Realme: [
        'Realme GT 6', 'Realme GT 5 Pro', 'Realme GT 5',
        'Realme 12 Pro+', 'Realme 12 Pro', 'Realme 12',
        'Realme 11 Pro+', 'Realme 11 Pro', 'Realme 11',
        'Realme C67', 'Realme C55', 'Realme C53', 'Realme C35', 'Realme C33',
        'Realme Narzo 70 Pro', 'Realme Narzo 60 Pro',
    ],
    Honor: [
        'Honor Magic 6 Pro', 'Honor Magic 6', 'Honor Magic 5 Pro',
        'Honor 200 Pro', 'Honor 200', 'Honor 90 Pro', 'Honor 90',
        'Honor X9b', 'Honor X8b', 'Honor X7b', 'Honor X6b',
        'Honor Play 60 Plus', 'Honor Play 50',
    ],
    Tecno: [
        'Tecno Camon 30 Pro', 'Tecno Camon 30', 'Tecno Camon 20 Pro',
        'Tecno Spark 20 Pro+', 'Tecno Spark 20 Pro', 'Tecno Spark 20',
        'Tecno Pop 8', 'Tecno Pop 7 Pro',
        'Tecno Phantom X2 Pro', 'Tecno Phantom X2',
    ],
    Alcatel: [
        'Alcatel 3X (2020)', 'Alcatel 1S (2021)', 'Alcatel 3L (2021)',
        'Alcatel 1B (2022)', 'Alcatel 1L (2021)', 'Alcatel Go Flip 4',
    ],
    ZTE: [
        'ZTE Blade A75', 'ZTE Blade A54', 'ZTE Blade A53 Pro',
        'ZTE Blade V40', 'ZTE Blade V30', 'ZTE Axon 40 Ultra',
    ],
    Infinix: [
        'Infinix Note 40 Pro+', 'Infinix Note 40 Pro', 'Infinix Note 40',
        'Infinix Hot 40 Pro', 'Infinix Hot 40', 'Infinix Hot 30',
        'Infinix Smart 8 Plus', 'Infinix Smart 8',
        'Infinix Zero 30', 'Infinix Zero 20',
    ],
}
