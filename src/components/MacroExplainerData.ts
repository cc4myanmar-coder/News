export interface EventScenario {
  marketImpact: string;
  nqBias: 'Bullish' | 'Bearish' | 'Neutral';
  esBias: 'Bullish' | 'Bearish' | 'Neutral';
  dxyBias: 'Bullish' | 'Bearish' | 'Neutral';
  descriptionBurmese: string;
}

export interface MacroDetails {
  eventName: string;
  meaningBurmese: string;
  meaningEnglish: string;
  nqImpactScore: number; // 1 to 10
  esImpactScore: number; 
  dxyImpactScore: number;
  dxyCorrelation: number; // Percentage of reverse correlation with DXY, e.g., -85 meaning -85%
  scenarios: {
    asExpected: EventScenario;
    greaterThanExpected: EventScenario;
    smallerThanExpected: EventScenario;
  };
}

export const MACRO_EXPLAINERS: Record<string, MacroDetails> = {
  cpi: {
    eventName: "CPI / Core CPI (Consumer Price Index - ငွေဖောင်းပွမှု အညွှန်းကိန်း)",
    meaningBurmese: "စားသုံးသူစျေးနှုန်းအညွှန်းကိန်း (CPI) သည် နိုင်ငံတွင်း ကုန်ပစ္စည်းနှင့် ဝန်ဆောင်မှုများ၏ စျေးနှုန်းဖောင်းပွမှုကို ကိန်းဂဏန်းဖြင့်ဖော်ပြသည်။ Core CPI သည် ကမ္ဘာ့စျေးကွက်လှုပ်ခတ်မှုများသော စားသောက်ကုန်နှင့် စွမ်းအင် (အစားအသောက်/ဆီ) တို့ကို ဖယ်ထုတ်တွက်ချက်ပြီး Fed ၏ အတိုးနှုန်းမူဝါဒအတွက် အရေးအကြီးဆုံးဖြစ်သည်။",
    meaningEnglish: "Consumer Price Index (CPI) measures inflation from the perspective of consumers. Core CPI excludes volatile food and energy sectors, serving as the Federal Reserve's primary metric for monetary policy decisions.",
    nqImpactScore: 9,
    esImpactScore: 8,
    dxyImpactScore: 9,
    dxyCorrelation: -94,
    scenarios: {
      asExpected: {
        marketImpact: "Priced-in Neutral Consolidate",
        nqBias: "Neutral",
        esBias: "Neutral",
        dxyBias: "Neutral",
        descriptionBurmese: "မျှော်မှန်းထားသည့် ကိန်းဂဏန်းအတိုင်းထွက်ရှိသဖြင့် သတင်းမထွက်မီကတည်းက စျေးကွက်ထဲ ထည့်သွင်းတွက်ချက်ပြီးသား (Priced-in) ဖြစ်နေတတ်သည်။ အတက်/အကျ ကြီးကြီးမားမားမရှိဘဲ Range-bound သို့မဟုတ် Side-ways ရွေ့လျားနိုင်သည်။"
      },
      greaterThanExpected: {
        marketImpact: "Hawkish Fed Pressure - High Volatility Selloff",
        nqBias: "Bearish",
        esBias: "Bearish",
        dxyBias: "Bullish",
        descriptionBurmese: "ငွေဖောင်းပွမှု မျှော်မှန်းထားသည်ထက် ပိုမိုမြင့်မားနေသဖြင့် (Hot CPI) Fed မှ အတိုးနှုန်းကို ကျဆင်းစေရန် ထိန်းသိမ်းထားနိုင် သို့မဟုတ် တိုးမြှင့်ရနိုင်ခြေရှိသည်။ ထို့ကြောင့် စတော့အညွှန်းကိန်း (NQ & ES) များ ပြုတ်ကျနိုင်ပြီး Dollar (DXY) သည် အားကောင်းစွာ မြင့်တက်လာနိုင်သည်။"
      },
      smallerThanExpected: {
        marketImpact: "Dovish Goldilocks Rally - Tech Surge",
        nqBias: "Bullish",
        esBias: "Bullish",
        dxyBias: "Bearish",
        descriptionBurmese: "ငွေဖောင်းပွမှု လျင်မြန်စွာ Cooling (အေးခဲ) လာသဖြင့် Fed မှ အတိုးနှုန်းလျှော့ချခြင်း (Rate Cuts) စတင်ရန် အခွင့်အလမ်းဖြစ်စေသည်။ Tech နယ်ပယ် (NQ) မှ အရှိန်အဟုန်ပြင်းစွာ Rally စတင်နိုင်ပြီး Dollar Index (DXY) အားနည်းကျဆင်းနိုင်သည်။"
      }
    }
  },
  ppi: {
    eventName: "PPI / Core PPI (Producer Price Index - ကုန်ထုတ်လုပ်သူ စျေးညွှန်း)",
    meaningBurmese: "ထုတ်လုပ်သူစျေးနှုန်းညွှန်းကိန်း (PPI) သည် ကုန်ထုတ်လုပ်သည့် လုပ်ငန်းရှင်များထံမှ ကုန်ကြမ်းစျေးနှုန်း တက်/ကျမှုကို တိုင်းတာသည်။ ၎င်းသည် နောက်ပိုင်းတွင် စားသုံးသူများထံ ရိုက်ခတ်လာမည့် CPI ငွေဖောင်းပွမှု၏ ရှေးပြေးနိမိတ် (Leading Indicator) အဖြစ် ယူဆရသည်။",
    meaningEnglish: "Producer Price Index (PPI) measures the average change over time in selling prices received by domestic producers. It is a critical leading indicator that filters into final consumer CPI inflation.",
    nqImpactScore: 8,
    esImpactScore: 7,
    dxyImpactScore: 8,
    dxyCorrelation: -88,
    scenarios: {
      asExpected: {
        marketImpact: "Inline with target - Normal flows",
        nqBias: "Neutral",
        esBias: "Neutral",
        dxyBias: "Neutral",
        descriptionBurmese: "စျေးကွက်အတွင်း လုပ်ငန်းရှင်များ၏ ထုတ်လုပ်မှုစရိတ်သည် မှန်းချက်အတိုင်း ထွက်ရှိသဖြင့် ကနဦး တုံ့ပြန်မှု ပြီးနောက် ပုံမှန် trend အတိုင်းသာ ဆက်သွားတတ်သည်။"
      },
      greaterThanExpected: {
        marketImpact: "Sticky Supply Chain Inflation - Negative for Equities",
        nqBias: "Bearish",
        esBias: "Bearish",
        dxyBias: "Bullish",
        descriptionBurmese: "ကုန်ထုတ်စရိတ် ပိုမိုမြင့်မားနေသဖြင့် နည်းပညာနှင့် ကာကွယ်ရေးလုပ်ငန်းများ၏ core margins ကို ထိခိုက်စေနိုင်သည်။ ကုန်စျေးနှုန်းတက်မည့် ဖိအားများလာသဖြင့် NQ နှင့် ES တို့ကို ကျဆင်းစေပြီး Dollar Index (DXY) ကို အားကောင်းစေတတ်သည်။"
      },
      smallerThanExpected: {
        marketImpact: "Margin Expansion - Risk-On Environment",
        nqBias: "Bullish",
        esBias: "Bullish",
        dxyBias: "Bearish",
        descriptionBurmese: "ထုတ်လုပ်မှုစရိတ် လျော့ကျသွားကြောင်း ပြသသဖြင့် လုပ်ငန်းရှင်များ၏ Profit margins တက်လာနိုင်ကာ စီးပွားရေးသက်သာလာသည်။ NQ Tech Futures မှ စျေးနှုန်းများ အမြင့်သို့ ဦးတည်လှုပ်ရှားနိုင်ပြီး Dollar အရောင်းဖိအားများလာနိုင်သည်။"
      }
    }
  },
  unemployment: {
    eventName: "Unemployment Claims (အလုပ်လက်မဲ့အာမခံ အသစ်တောင်းခံသူဦးရေ)",
    meaningBurmese: "တစ်ပတ်အတွင်း ပထမဆုံးအကြိမ် အလုပ်လက်မဲ့အကျိုးခံစားခွင့် တောင်းဆိုသည့် ဦးရေဖြစ်သည်။ အမေရိကန် အလုပ်သမားစျေးကွက် (Labor Market) မည်မျှအင်အားတောင့်တင်း/အားနည်းနေသည်ကို လတ်တလော သိရှိနိုင်သော အပတ်စဉ် Metrics ဖြစ်သည်။",
    meaningEnglish: "Initial Jobless Claims measures the number of individuals filing for state unemployment insurance for the first time, providing a near-realtime gauge of labor market strength.",
    nqImpactScore: 7,
    esImpactScore: 7,
    dxyImpactScore: 7,
    dxyCorrelation: -85,
    scenarios: {
      asExpected: {
        marketImpact: "Stable labor market trend",
        nqBias: "Neutral",
        esBias: "Neutral",
        dxyBias: "Neutral",
        descriptionBurmese: "လုပ်သားစျေးကွက် တည်ငြိမ်နေသဖြင့် လက်ရှိ Fed ၏ မူဝါဒလမ်းကြောင်းပေါ် သက်ရောက်မှု မပြောင်းလဲစေဘဲ စျေးကွက် လှုပ်ရှားမှုအေးစက်နေနိုင်သည်။"
      },
      greaterThanExpected: {
        marketImpact: "Weak Economy (Bad News is Good News for Cuts)",
        nqBias: "Bullish", // Bad news = rate cuts likely = bullish for stocks
        esBias: "Bullish",
        dxyBias: "Bearish",
        descriptionBurmese: "အလုပ်လက်မဲ့ဦးရေ အများအပြား ရှိနေခြင်းက စီးပွားရေးနှေးကွေးလာကြောင်း ပြသရာ Fed အနေဖြင့် အတိုးနှုန်းကို ဆက်မထိန်းဘဲ အမြန်လျှော့ချရတော့မည် ဖြစ်သည်။ 'Bad News is Good News' သီအိုရီအရ စတော့အညွှန်းကိန်းများ Rally တက်ပြီး Dollar ကျဆင်းလေ့ရှိသည်။"
      },
      smallerThanExpected: {
        marketImpact: "Tight Labor Market (Fears of Hawkish Fed)",
        nqBias: "Bearish",
        esBias: "Bearish",
        dxyBias: "Bullish",
        descriptionBurmese: "အလုပ်ခန့်မှုအရမ်းကောင်းပြီး အလုပ်လက်မဲ့ နည်းပါးလွန်းနေခြင်းက အိမ်ထောင်စုများ သုံးစွဲအားကောင်းစေပြီး ငွေဖောင်းပွမှု ပြန်တက်စေနိုင်သည်။ Fed က အတိုးနှုန်းကို ရှည်လျားစွာ မြင့်ထားရန် သေချာစေသဖြင့် NQ နှင့် ES ကို ကျစေကာ Dollar ဖောင်းပွတက်လာစေနိုင်သည်။"
      }
    }
  },
  sentiment: {
    eventName: "Prelim UoM Consumer Sentiment (စားသုံးသူ ယုံကြည်မှုညွှန်းကိန်း)",
    meaningBurmese: "စားသုံးသူများ၏ စီးပွားရေးအပေါ် ယုံကြည်စိတ်ချမှုနှင့် သုံးစွဲရန်စိတ်ဆန္ဒကို စစ်တမ်းကောက်ယူဖော်ပြခြင်း ဖြစ်သည်။ စားသုံးသူများ အကောင်းမြင်လေ ဝယ်လိုအားတက်လေဖြစ်ပြီး Retail & Business ဝင်ငွေမြင့်တက်စေသည်။",
    meaningEnglish: "University of Michigan Consumer Sentiment Index gauges consumer confidence levels regarding personal finances, business conditions, and purchasing power.",
    nqImpactScore: 6,
    esImpactScore: 7,
    dxyImpactScore: 6,
    dxyCorrelation: -82,
    scenarios: {
      asExpected: {
        marketImpact: "Moderate consumer health",
        nqBias: "Neutral",
        esBias: "Neutral",
        dxyBias: "Neutral",
        descriptionBurmese: "စားသုံးသူများ၏ အပြုအမူပုံမှန်ရှိပြီး အလွန်အမင်း ဝယ်ခြင်း/ခြွေတာခြင်းမရှိသဖြင့် စျေးကွက်အတွင်း အတက်အကျ ပုံမှန်သာ တည်ရှိနိုင်သည်။"
      },
      greaterThanExpected: {
        marketImpact: "Strong Consumption - Soft Landing Potential",
        nqBias: "Bearish", // Strict economist setup: High DXY = bearish pressure for stock multiples
        esBias: "Bearish", // Strict economist setup: High DXY = bearish pressure for stock multiples
        dxyBias: "Bullish",
        descriptionBurmese: "ယုံကြည်မှု မြင့်တက်သဖြင့် စားသုံးမှု အားကောင်းပြီး အတိုးနှုန်း/Yields ကို ပိုမိုမြင့်တက်စေကာ Dollar (DXY) ကို အားကောင်းစေမည်။ ဒေါ်လာအင်အားတက်လာခြင်းနှင့် strict reverse correlation အရ စတော့ညွှန်းကိန်းများ (NQ/ES) အပေါ် Bearish အရောင်းဖိအား သို့မဟုတ် အမြင့်ပိုင်းတွင် resistance ရိုက်ခတ်မှုဖြစ်စေနိုင်သည်။"
      },
      smallerThanExpected: {
        marketImpact: "Recession Fears - Underconsumption Risk",
        nqBias: "Bullish", // Strict economist setup: Low DXY due to weak growth / cuts expectations = stock pump
        esBias: "Bullish", // Strict economist setup: Low DXY due to weak growth / cuts expectations = stock pump
        dxyBias: "Bearish",
        descriptionBurmese: "ယုံကြည်မှုလျော့ကျခြင်းက စီးပွားရေးနှေးကွေးမှုကို ဖြစ်ပေါ်စေပြီး အတိုးနှုန်းလျှော့ချမည့်ခန့်မှန်းချက် ပိုမိုအားကောင်းလာသဖြင့် Dollar (DXY) ကျဆင်းစေသည်။ Dollar ကျဆင်းခြင်းကြောင့် strict reverse correlation (ဒေါ်လာနှင့် ဆန့်ကျင်ဘက် အချိုးကျခြင်း) အရ NQ နှင့် ES ညွှန်းကိန်းများ Bullish အားကောင်းစွာ မြင့်တက်စွမ်းဆောင်နိုင်သည်။"
      }
    }
  },
  inflation_exp: {
    eventName: "Prelim UoM Inflation Expectations (ငွေဖောင်းပွမှု မျှော်မှန်းချက်ညွှန်းကိန်း)",
    meaningBurmese: "အိမ်ထောင်စုများမှ လာမည့် ၁ နှစ် မှ ၅ နှစ်အတွင်း ဖြစ်လာနိုင်မည့် ငွေဖောင်းပွမှုကို ခန့်မှန်းဖော်ပြချက် ဖြစ်သည်။ အကယ်၍ ငွေဖောင်းပွမှု မျှော်မှန်းချက်များ မြင့်တက်နေပါက စားသုံးသူများ ကြိုတင်ဝယ်ယူကြသဖြင့် တကယ်ဖြစ်လာစေရန် တွန်းအားပေးသကဲ့သို့ ဖြစ်စေသည်။",
    meaningEnglish: "UoM Inflation Expectations reflects consumers' future expectations of inflation over the short/medium term, widely monitored by policy makers to prevent self-fulfilling inflation loops.",
    nqImpactScore: 8,
    esImpactScore: 7,
    dxyImpactScore: 8,
    dxyCorrelation: -91,
    scenarios: {
      asExpected: {
        marketImpact: "Inflation expectations anchored",
        nqBias: "Neutral",
        esBias: "Neutral",
        dxyBias: "Neutral",
        descriptionBurmese: "လူထု၏ မျှော်မှန်းချက် တည်ငြိမ်နေသဖြင့် စျေးကွက်တွင် စိုးရိမ်ပူပန်မှုမရှိဘဲ သမားရိုးကျ trend အတိုင်း ဆက်လက်ရွေ့လျားသည်။"
      },
      greaterThanExpected: {
        marketImpact: "De-anchored Expectations (Fears of Uncontrolled Inflation)",
        nqBias: "Bearish",
        esBias: "Bearish",
        dxyBias: "Bullish",
        descriptionBurmese: "မျှော်မှန်းချက် တောမီးကဲ့သို့ မြင့်တက်လာခြင်းသည် Fed ကို အလွန်ထိတ်လန့်စေပြီး ပိုမို Hawkish အတိုးနှုန်းမြှင့်ရန် တွန်းအားဖြစ်စေသည်။ Tech (NQ) futures စျေးနှုန်းများ ကျဆင်းစေပြီး DXY သို့ ရင်းနှီးငွေအလုံးအရင်း ဝင်ရောက်စေနိုင်သည်။"
      },
      smallerThanExpected: {
        marketImpact: "Inflation Expectations Cooling down",
        nqBias: "Bullish",
        esBias: "Bullish",
        dxyBias: "Bearish",
        descriptionBurmese: "ငွေဖောင်းပွမှုအပေါ် လူထုစိုးရိမ်မှု လျော့ကျလာခြင်းက Fed အနေဖြင့် အေးအေးလူလူ အတိုးနှုတ်ယူနိုင်စေသဖြင့် Stock Markets အားလုံး (NQ / ES) အတွက် မီးစိမ်းပြပြီး Dollar တန်ဖိုးကို အားလျော့စေသည်။"
      }
    }
  },
  retail_sales: {
    eventName: "Retail Sales / Core Retail Sales (လက်လီရောင်းအားညွှန်းကိန်း)",
    meaningBurmese: "စားသုံးသူများ၏ လက်လီဝယ်ယူမှု ပမာဏကို တိုင်းတာခြင်း ဖြစ်သည်။ US စီးပွားရေးလည်ပတ်မှု၏ ၇၀ ရာခိုင်နှုန်းခန့်သည် စားသုံးသူသုံးစွဲမှုအပေါ် အခြေခံသဖြင့် စီးပွားရေးအင်အားကောင်းမွန်မှုကို တိုင်းတာရန် အလွန်ထိရောက်သည်။",
    meaningEnglish: "Retail Sales measures the total receipts of retail stores. It provides a key gauge of consumer spending, which accounts for approximately 70% of total US GDP.",
    nqImpactScore: 8,
    esImpactScore: 8,
    dxyImpactScore: 8,
    dxyCorrelation: -85,
    scenarios: {
      asExpected: {
        marketImpact: "Market Stable - Standard Volume Flows",
        nqBias: "Neutral",
        esBias: "Neutral",
        dxyBias: "Neutral",
        descriptionBurmese: "မျှော်မှန်းထားသည့်အတိုင်း ထွက်ရှိသဖြင့် သမားရိုးကျ Trading Range များအတွင်း စျေးကွက် ဆက်လက်စုစည်းနေပါမည်။"
      },
      greaterThanExpected: {
        marketImpact: "Strong Economy - Higher DXY Pressure",
        nqBias: "Bearish",
        esBias: "Bearish",
        dxyBias: "Bullish",
        descriptionBurmese: "လက်လီရောင်းအား မျှော်လင့်ထားသည်ထက် ပိုမိုမြင့်မားနေခြင်းက စားသုံးသူ သုံးစွဲနိုင်စွမ်း အလွန် ကောင်းမွန်နေကြောင်း ပြသသည်။ ယင်းက ငွေဖောင်းပွမှု ဖိအားကို မြင့်မားစေနိုင်ပြီး Fed အနေဖြင့် အတိုးနှုန်းကို ဆက်ထိန်းထားရန် လှုံ့ဆော်သဖြင့် NQ နှင့် ES ကို ဖိအားပေး ကျဆင်းစေနိုင်ပြီး Dollar Index (DXY) မြင့်တက်စေသည်။"
      },
      smallerThanExpected: {
        marketImpact: "Cooling Economy - Rate Cut Catalyst",
        nqBias: "Bullish",
        esBias: "Bullish",
        dxyBias: "Bearish",
        descriptionBurmese: "စားသုံးမှု လျော့ကျခြင်းက စီးပွားရေးအေးစက်လာကြောင်း ဖော်ပြပြီး Fed မှ အတိုးနှုန်း လျှော့ချရန် လမ်းစဖြစ်စေသဖြင့် မက်ကရို reverse correlation အားဖြင့် Dollar ကို ကျဆင်းစေပြီး စတော့အညွှန်းကိန်း futures (NQ, ES) များကို မြင့်တက်စေသည်။"
      }
    }
  },
  fomc: {
    eventName: "FOMC Federal Funds Rate / Statement (အတိုးနှုန်းမူဝါဒနှင့် သဘောထားကြေညာချက်)",
    meaningBurmese: "Federal Open Market Committee (FOMC) အစည်းအဝေးမှ အမေရိကန်၏ အခြေခံအတိုးနှုန်းကို အပြောင်းအလဲပြုလုပ်ရန် ဆုံးဖြတ်ခြင်း ဖြစ်သည်။ Fed ဥက္ကဋ္ဌ၏ စီးပွားရေးအပေါ် သုံးသပ်ချက် မူဝါဒစကားများသည် စျေးကွက်တစ်ခုလုံးအတွက် အလှုပ်ခတ်ဆုံးသော Catalyst ဖြစ်သည်။",
    meaningEnglish: "The Federal Open Market Committee (FOMC) announces the official US federal funds rate. Its forward-looking statement and subsequent press conference are the most critical drivers of interest rate expectations and financial market liquidity.",
    nqImpactScore: 10,
    esImpactScore: 10,
    dxyImpactScore: 10,
    dxyCorrelation: -96,
    scenarios: {
      asExpected: {
        marketImpact: "Priced-in Neutral - Watching Statement details",
        nqBias: "Neutral",
        esBias: "Neutral",
        dxyBias: "Neutral",
        descriptionBurmese: "အတိုးနှုန်းကို မျှော်မှန်းထားသည့်အတိုင်း ပြောင်းလဲခြင်းမရှိဘဲ ထားရှိပါက ကနဦးတွင် ငြိမ်သက်နေနိုင်သော်လည်း Statement ပါ Fed ဥက္ကဋ္ဌ၏ စကားလုံး သုံးနှုန်းပုံ (Dovish / Hawkish tone) အပေါ်မူတည်၍ အတက်/အကျ အလွန် ပြင်းထန်နိုင်သည်။"
      },
      greaterThanExpected: {
        marketImpact: "Hawkish Rate Surge - High Volatility Selloff",
        nqBias: "Bearish",
        esBias: "Bearish",
        dxyBias: "Bullish",
        descriptionBurmese: "မျှော်လင့်ထားသည်ထက် ပိုမိုမြင့်မားသော အတိုးနှုန်း သတ်မှတ်ခြင်း သို့မဟုတ် Fed ၏ စကားရပ်များက Hawkish (တင်းကြပ်ရန်) ဘက်သို့ တိမ်းညွှတ်နေပါက Equities အကုန် ပြိုကျနိုင်ပြီး Dollar Index (DXY) သည် အရှိန်အဟုန်ပြင်းစွာ ထိုးတက်လာတတ်သည်။"
      },
      smallerThanExpected: {
        marketImpact: "Dovish Rate Cut - Massive Index Rally",
        nqBias: "Bullish",
        esBias: "Bullish",
        dxyBias: "Bearish",
        descriptionBurmese: "အတိုးနှုန်း လျှော့ချခြင်း သို့မဟုတ် ရှေ့တွင် အမြန်ဆုံး လျှော့ချတော့မည်ဖြစ်ကြောင်း Fed ၏ သဘောထားပျော့ပျောင်းမှု (Dovish tone) ပြသပါက Liquidity အလွန်ကောင်းမွန်လာသဖြင့် စတော့ futures များ NQ နှင့် ES အပြင်းအထန် တဟုန်ထိုး Rally တက်ကာ Dollar ဖိနှိပ်ကျဆင်းသွားသည်။"
      }
    }
  }
};

/**
 * Normalizes event title to detect key macro patterns
 */
export function getMacroDetailsForEvent(eventName: string): MacroDetails {
  const norm = eventName.toLowerCase();
  
  if (norm.includes('cpi')) {
    return MACRO_EXPLAINERS.cpi;
  }
  if (norm.includes('ppi')) {
    return MACRO_EXPLAINERS.ppi;
  }
  if (norm.includes('jobless') || norm.includes('unemployment') || norm.includes('employment') || norm.includes('claims')) {
    return MACRO_EXPLAINERS.unemployment;
  }
  if (norm.includes('sentiment') || norm.includes('confidence')) {
    return MACRO_EXPLAINERS.sentiment;
  }
  if (norm.includes('inflation expectation') || norm.includes('uom inflation')) {
    return MACRO_EXPLAINERS.inflation_exp;
  }
  if (norm.includes('retail') || norm.includes('sales')) {
    return MACRO_EXPLAINERS.retail_sales;
  }
  if (norm.includes('fomc') || norm.includes('federal funds') || norm.includes('rate decision') || norm.includes('fed interest') || norm.includes('fed funds') || norm.includes('rate')) {
    return MACRO_EXPLAINERS.fomc;
  }
  
  // Generic / Default details
  return {
    eventName: eventName,
    meaningBurmese: `ခေါင်းစဉ်ပါ ${eventName} သည် စျေးကွက်၏ စီးပွားရေးလည်ပတ်မှုကို တိုင်းတာသော အရေးကြီး မက်ကရို (Macro) သတင်းထုတ်ပြန်ချက်တစ်ခု ဖြစ်သည်။`,
    meaningEnglish: `The event '${eventName}' represents a key macroeconomic indicators release reflecting current financial or economic pulse guidelines.`,
    nqImpactScore: 6,
    esImpactScore: 6,
    dxyImpactScore: 6,
    dxyCorrelation: -85,
    scenarios: {
      asExpected: {
        marketImpact: "Baseline Priced-in",
        nqBias: "Neutral",
        esBias: "Neutral",
        dxyBias: "Neutral",
        descriptionBurmese: "မျှော်မှန်းသည့်အတိုင်း အတိအကျ ထွက်ပေါ်လာသဖြင့် စျေးကွက်တွင် ကြီးမားလှုပ်ရှားမှု မရှိဘဲ ပုံမှန်အတိုင်း သမားရိုးကျ Console Flow များ ဆက်သွားနိုင်ပါသည်။"
      },
      greaterThanExpected: {
        marketImpact: "Higher Economic Activity / Output Pressure",
        nqBias: "Bearish", // Corrected to sustain Strict Reverse Correlation with Bullish DXY
        esBias: "Bearish", // Corrected to sustain Strict Reverse Correlation with Bullish DXY
        dxyBias: "Bullish",
        descriptionBurmese: "မှန်းချက်ထက် ကိန်းဂဏန်း မြင့်မားစွာ ထွက်ပေါ်လာခြင်းဖြစ်သည်။ ယင်းသည် အတိုးနှုန်း/Yields မြင့်တက်စေသဖြင့် ဒေါ်လာ (DXY) ကို အားကောင်းစေပြီး (Bullish)၊ ဒေါ်လာနှင့် ဆန့်ကျင်ဘက်ဖြစ်သောကြောင့် စတော့အညွှန်းကိန်းများ (NQ & ES) ကို ကနဦး ကျဆင်းစေနိုင်ပါသည် (Bearish)။"
      },
      smallerThanExpected: {
        marketImpact: "Lower Economic Output / Decreasing Pressure",
        nqBias: "Bullish", // Corrected to sustain Strict Reverse Correlation with Bearish DXY
        esBias: "Bullish", // Corrected to sustain Strict Reverse Correlation with Bearish DXY
        dxyBias: "Bearish",
        descriptionBurmese: "မှန်းချက်အောက် ကိန်းဂဏန်းနိမ့်ကျစွာ ထွက်ရှိသဖြင့် သက်သာသော အတိုးနှုန်းခန့်မှန်းချက်ကြောင့် ဒေါ်လာ (DXY) အားနည်းသွားစေပြီး (Bearish)၊ strict reverse correlation အရ စတော့အညွှန်းကိန်းများ (NQ & ES) ကို အားကောင်းစွာ မြင့်တက်စေနိုင်ပါသည် (Bullish)။"
      }
    }
  };
}
