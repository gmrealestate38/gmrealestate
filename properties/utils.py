"""
Yeh file frontend ke do JS files ki server-side "mirror" hai:
- asstes/js/agents-data.js  (TOWN_AGENTS mapping)
- asstes/js/main.js         (CATEGORY_GROUPS grouping)

Dono jagah (frontend aur backend) yeh values sync rehni chahiye.
"""

TOWN_AGENTS = {
    'Gulshan-e-Iqbal Town': '923001111001',
    'Gulistan-e-Johar': '923001111002',
    'DHA Phase 1 to 8': '923001111003',
    'Clifton': '923001111004',
    'Bahria Town Karachi': '923001111005',
    'North Nazimabad Town': '923001111006',
    'Nazimabad': '923001111007',
    'PECHS': '923001111008',
    'Federal B Area (Gulberg)': '923001111009',
    'Scheme 33': '923001111010',
    'Malir Cantt': '923001111011',
    'Malir Town': '923001111012',
    'Model Colony': '923001111013',
    'Korangi Town': '923001111014',
    'Landhi Town': '923001111015',
    'Saddar Town': '923001111016',
    'Jamshed Town': '923001111017',
    'Liaquatabad Town': '923001111018',
    'Orangi Town': '923001111019',
    'SITE Town': '923001111020',
    'Keamari Town': '923001111021',
    'Lyari Town': '923001111022',
    'Gadap Town': '923001111023',
    'Hawkesbay / Mauripur': '923001111024',
    'North Karachi / New Karachi': '923001111025',
    'Other Area': '923001111000',
}

DEFAULT_AGENT_PHONE = '923001111000'

CATEGORY_GROUPS = {
    'Commercial': ['Shop', 'Godown / Warehouse', 'Office', 'Plaza / Building', 'Commercial'],
    'House': ['House', 'Portion'],
}


def get_agent_phone_for_town(town_name):
    """Property ka 'town' field is dict mein dhoondh kar agent ka number deta hai."""
    return TOWN_AGENTS.get(town_name, DEFAULT_AGENT_PHONE)


def types_for_category(category):
    """
    'Commercial' ya 'House' jaisi broad category ke liye, us mein shamil
    saari specific 'type' values ki list deta hai (queryset filter ke liye).
    Agar category kisi group mein na ho, to sirf wahi single type maana
    jata hai (e.g. 'Flat', 'Plot', 'Guest House', 'Hut / Farm House').
    """
    return CATEGORY_GROUPS.get(category, [category])