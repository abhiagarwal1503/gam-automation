export interface NetworkInfo {
  name: string;
  code: string;
  shortName?: string;
}

export interface NetworkAdvertiser {
  id: string;
  name: string;
}

export const MANAGED_NETWORKS: NetworkInfo[] = [
  { name: 'Blinkcorp Technologies Private Limited', code: '22068249324', shortName: 'Blinkcorp' },
  { name: 'The Federal', code: '22665183713', shortName: 'The Federal' },
  { name: 'News Track', code: '22212039110', shortName: 'News Track' },
  { name: 'new powergame', code: '22827981500', shortName: 'new powergame' },
  { name: 'Hyderabad Media House L', code: '310443190', shortName: 'Hyderabad Media House' }
];

export const NETWORK_ADVERTISERS: Record<string, NetworkAdvertiser[]> = {
  // Blinkcorp Technologies (22068249324)
  '22068249324': [
    { id: '6156180870', name: 'ABHishke' },
    { id: '6074141268', name: 'Assam Tribune' },
    { id: '5225386500', name: 'hocalwire' },
    { id: '6155483951', name: 'kkkkaaaassss' },
    { id: '5881247959', name: 'Mpost' },
    { id: '6126803745', name: 'Pratahkal' },
    { id: '5880174211', name: 'shamim' },
    { id: '5247096423', name: 'srgd' },
    { id: '6155963446', name: 'TechStar Brand' },
    { id: '6155883565', name: 'testingforatuo' }
  ],
  // The Federal (22665183713)
  '22665183713': [
    { id: '6156180871', name: 'The Federal Sponsor' },
    { id: '6156180872', name: 'Federal National Brands' },
    { id: '6156180873', name: 'Federal Retail Agency' },
    { id: '5225386500', name: 'Hocalwire Media' },
    { id: '5234810863', name: 'Google Marketing' }
  ],
  // new powergame (22827981500)
  '22827981500': [
    { id: '5264533411', name: 'CG Samvad' },
    { id: '5640784962', name: 'Govt. Ads' },
    { id: '5849475494', name: 'NPG ad' }
  ],
  // News Track (22212039110)
  '22212039110': [
    { id: '5475101459', name: 'Chocolate Platform' },
    { id: '5475397677', name: 'Equativ' },
    { id: '5475418512', name: 'Fluct' },
    { id: '5234810863', name: 'Google' },
    { id: '5961899213', name: 'gov_ad' },
    { id: '5249446503', name: 'govt-uttrakhand' },
    { id: '5121434345', name: 'Indian Navy' },
    { id: '5475308308', name: 'InMobi' },
    { id: '5407820332', name: 'justbaat' },
    { id: '5245526607', name: 'NativKlick' },
    { id: '5236392682', name: 'Newstrack' },
    { id: '5475121823', name: 'OneTag' },
    { id: '5475137486', name: 'PubMatic' },
    { id: '5040669480', name: 'UK Govt' },
    { id: '4958395134', name: 'UP Government' }
  ],
  // Hyderabad Media House (310443190)
  '310443190': [
    { id: '4479789270', name: 'Adx' },
    { id: '4911553386', name: 'Amazon' },
    { id: '5166562757', name: 'ArthBroadcast' },
    { id: '4817076169', name: 'ATD_HB_Advertiser' },
    { id: '4075189470', name: 'Baba Network' },
    { id: '5061308610', name: 'Brandingnuts' },
    { id: '4999244396', name: 'Clever' },
    { id: '5140202774', name: 'Ferty9' },
    { id: '5136555730', name: 'GOI' },
    { id: '5078249509', name: 'Google AdSense' },
    { id: '4075195950', name: 'GoogleAdSense' },
    { id: '4151784030', name: 'HANS' },
    { id: '5616289601', name: 'HMHL' },
    { id: '4241615430', name: 'HMTV' },
    { id: '4400911667', name: 'Increaserev' },
    { id: '5120992233', name: 'Indian Navy' },
    { id: '4405037713', name: 'Insticator' },
    { id: '5166450131', name: 'irisFlorets' },
    { id: '5166974806', name: 'KAPIL GROUP' },
    { id: '5138775079', name: 'Maruti' }
  ]
};
