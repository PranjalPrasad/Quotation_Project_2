/* ============================================================
   TERMS_CONFIG — static Terms & Conditions text for quotations.
   Frontend-only config, NOT stored per-quotation. Only
   { templateVersion, categoriesApplied } is saved on a quotation
   record — this file is the single source of truth for the actual
   wording. Bump `version` whenever the legal text changes so old
   quotations can be traced back to the wording that applied when
   they were generated.
   ============================================================ */

window.TERMS_CONFIG = {
  version: 'DEFAULT_TC_V1',

  base: {
    english: [
      'Prices quoted are ex-works Agra and are exclusive of GST unless otherwise stated.',
      'GST will be charged extra as applicable at the time of delivery.',
      'Delivery will commence only after receipt of full advance / agreed payment milestone as per the payment schedule.',
      'Delivery timeline mentioned is indicative and may vary due to raw material availability, transport, or force majeure conditions.',
      'This quotation is valid only until the date mentioned above; prices are subject to revision after expiry.',
      'Cancellation after advance payment will attract a deduction towards processing and material costs already incurred.',
      'All cheques and drafts should be made in favour of Vaishnokripa Mercantile.',
      'Standard machine warranty applies only to manufacturing defects and excludes wear-and-tear, misuse, or unauthorized modification.',
      'Any dispute arising out of this quotation shall be subject to Agra jurisdiction only.',
      'Freight, loading and unloading charges are extra unless specifically included in the cost breakdown above.'
    ],
    hindi: [
      'उद्धृत मूल्य आगरा एक्स-वर्क्स हैं और जब तक अन्यथा न बताया जाए, GST शामिल नहीं है।',
      'डिलीवरी के समय लागू GST अतिरिक्त लिया जाएगा।',
      'भुगतान अनुसूची के अनुसार पूर्ण अग्रिम / सहमत भुगतान प्राप्त होने के बाद ही डिलीवरी शुरू होगी।',
      'बताई गई डिलीवरी समयसीमा अनुमानित है और कच्चे माल की उपलब्धता, परिवहन या अप्रत्याशित परिस्थितियों के कारण बदल सकती है।',
      'यह कोटेशन केवल ऊपर बताई गई तिथि तक ही मान्य है; समाप्ति के बाद मूल्य में संशोधन हो सकता है।',
      'अग्रिम भुगतान के बाद रद्द करने पर पहले से हुई प्रोसेसिंग व सामग्री लागत की कटौती की जाएगी।',
      'सभी चेक और ड्राफ्ट Vaishnokripa Mercantile के पक्ष में बनाए जाएं।',
      'मानक मशीन वारंटी केवल निर्माण दोषों पर लागू होती है और टूट-फूट, दुरुपयोग या अनधिकृत बदलाव को इसमें शामिल नहीं किया गया है।',
      'इस कोटेशन से उत्पन्न किसी भी विवाद के लिए केवल आगरा क्षेत्राधिकार मान्य होगा।',
      'माल भाड़ा, लोडिंग व अनलोडिंग शुल्क तब तक अतिरिक्त हैं जब तक ऊपर लागत विवरण में विशेष रूप से शामिल न किए गए हों।'
    ]
  },

  categoryExtras: {
    'Brick Machine': {
      english: [
        'Machine output figures are approximate and depend on raw material quality, moisture content, and operator skill.',
        'Customer must ensure the shed/foundation and power supply meet the specifications shared before dispatch.',
        'Erection, commissioning and trial run will be scheduled only after the site is confirmed ready by the customer.'
      ],
      hindi: [
        'मशीन उत्पादन आंकड़े अनुमानित हैं और कच्चे माल की गुणवत्ता, नमी की मात्रा व ऑपरेटर के कौशल पर निर्भर करते हैं।',
        'ग्राहक को यह सुनिश्चित करना होगा कि शेड/नींव और बिजली आपूर्ति डिस्पैच से पहले साझा किए गए विनिर्देशों को पूरा करती हो।',
        'इरेक्शन, कमीशनिंग और ट्रायल रन तभी निर्धारित किया जाएगा जब ग्राहक द्वारा साइट तैयार होने की पुष्टि की जाएगी।'
      ]
    },
    'Mould': {
      english: [
        'Mould dimensions and cavity count are as specified in the item description; custom sizes may involve additional cost and lead time.',
        'Moulds are covered under warranty only against manufacturing defects, not against wear from regular use.'
      ],
      hindi: [
        'मोल्ड के आयाम और कैविटी संख्या आइटम विवरण में बताए अनुसार हैं; कस्टम आकार के लिए अतिरिक्त लागत व समय लग सकता है।',
        'मोल्ड केवल निर्माण दोषों के विरुद्ध वारंटी के अंतर्गत आते हैं, नियमित उपयोग से होने वाली टूट-फूट के विरुद्ध नहीं।'
      ]
    }
  }
};