export const venues = [
  { id: "ny-nj", city: "New York/New Jersey", stadium: "New York New Jersey Stadium", region: "East", capacity: 82500, transit: "rail hub and shuttle fan loops", baseRisk: 66, baseWait: 13, access: 95, waste: 70 },
  { id: "toronto", city: "Toronto", stadium: "Toronto Stadium", region: "East", capacity: 45500, transit: "GO, TTC, and waterfront walkways", baseRisk: 58, baseWait: 9, access: 96, waste: 74 },
  { id: "boston", city: "Boston", stadium: "Boston Stadium", region: "East", capacity: 65000, transit: "regional rail plus remote lots", baseRisk: 61, baseWait: 11, access: 94, waste: 69 },
  { id: "philadelphia", city: "Philadelphia", stadium: "Philadelphia Stadium", region: "East", capacity: 69000, transit: "subway sports complex connector", baseRisk: 63, baseWait: 12, access: 95, waste: 72 },
  { id: "miami", city: "Miami", stadium: "Miami Stadium", region: "East", capacity: 65000, transit: "Metrorail, shuttle, and rideshare rings", baseRisk: 68, baseWait: 14, access: 93, waste: 66 },
  { id: "dallas", city: "Dallas", stadium: "Dallas Stadium", region: "Central", capacity: 94000, transit: "regional rail, buses, and managed parking", baseRisk: 70, baseWait: 15, access: 95, waste: 68 },
  { id: "kansas", city: "Kansas City", stadium: "Kansas City Stadium", region: "Central", capacity: 73000, transit: "shuttle spine and park-and-ride", baseRisk: 62, baseWait: 12, access: 94, waste: 71 },
  { id: "houston", city: "Houston", stadium: "Houston Stadium", region: "Central", capacity: 72000, transit: "light rail and climate-managed queues", baseRisk: 67, baseWait: 13, access: 96, waste: 70 },
  { id: "atlanta", city: "Atlanta", stadium: "Atlanta Stadium", region: "Central", capacity: 75000, transit: "MARTA rail and downtown fan walks", baseRisk: 64, baseWait: 10, access: 97, waste: 76 },
  { id: "monterrey", city: "Monterrey", stadium: "Estadio Monterrey", region: "Central", capacity: 53500, transit: "metro feeders and mountain corridor shuttles", baseRisk: 60, baseWait: 10, access: 93, waste: 67 },
  { id: "mexico-city", city: "Mexico City", stadium: "Mexico City Stadium", region: "Central", capacity: 83000, transit: "metro, bus rapid transit, and fan walks", baseRisk: 69, baseWait: 14, access: 92, waste: 69 },
  { id: "vancouver", city: "Vancouver", stadium: "BC Place Vancouver", region: "West", capacity: 54000, transit: "SkyTrain and waterfront walking routes", baseRisk: 56, baseWait: 8, access: 97, waste: 78 },
  { id: "seattle", city: "Seattle", stadium: "Seattle Stadium", region: "West", capacity: 69000, transit: "light rail and stadium district walks", baseRisk: 59, baseWait: 10, access: 96, waste: 77 },
  { id: "sf-bay", city: "San Francisco Bay Area", stadium: "San Francisco Bay Area Stadium", region: "West", capacity: 71000, transit: "Caltrain, VTA, and bike corridors", baseRisk: 65, baseWait: 12, access: 95, waste: 73 },
  { id: "los-angeles", city: "Los Angeles", stadium: "Los Angeles Stadium", region: "West", capacity: 70240, transit: "metro connectors and rideshare buffers", baseRisk: 71, baseWait: 16, access: 94, waste: 67 },
  { id: "guadalajara", city: "Guadalajara", stadium: "Estadio Guadalajara", region: "West", capacity: 48000, transit: "light rail and managed bus gates", baseRisk: 57, baseWait: 9, access: 93, waste: 70 }
];

export const scenarios: Record<string, any> = {
  gateSurge: {
    label: "Gate surge",
    desc: "Entry pressure rising at East and North gates.",
    riskBoost: 15,
    waitBoost: 8,
    accessBoost: -1,
    wasteBoost: 0,
    zones: { north: 86, south: 45, west: 66, east: 92, transit: 72, fan: 40, bowl: 48 },
    actions: [
      ["critical", "Open overflow lanes at East Gate", "Security captain routes 18 staff to temporary lanes E4-E7. Target relief in 6 minutes."],
      ["high", "Push fans toward South Gate", "Publish translated app alert and change LED boards on the transit plaza."],
      ["medium", "Hold two concourse vendor promos", "Pause east-side flash offers that attract cross-flow until density drops below 75%."],
      ["medium", "Notify transit partner", "Ask rail platform team to stagger arrivals by one train cycle."]
    ]
  },
  accessReroute: {
    label: "Accessibility reroute",
    desc: "One elevator bank is offline near East Concourse.",
    riskBoost: 6,
    waitBoost: 4,
    accessBoost: -13,
    wasteBoost: 0,
    zones: { north: 62, south: 48, west: 58, east: 78, transit: 60, fan: 35, bowl: 52 },
    actions: [
      ["critical", "Protect step-free corridor", "Volunteer lead sets a staffed corridor from Transit Plaza to Section 118 via the West lift bank."],
      ["high", "Dispatch mobility carts", "Send 4 carts to the north curb and keep one at medical for urgent requests."],
      ["high", "Update accessible ticket holders", "Send personalized route guidance in the selected language with elevator status and estimated time."],
      ["medium", "Escalate facilities repair", "Facilities team posts 12 minute repair estimate and confirms spare parts."]
    ]
  },
  stormDelay: {
    label: "Storm delay",
    desc: "Weather cell could slow ingress and outdoor fan activity.",
    riskBoost: 12,
    waitBoost: 6,
    accessBoost: -3,
    wasteBoost: -2,
    zones: { north: 74, south: 68, west: 72, east: 76, transit: 80, fan: 22, bowl: 46 },
    actions: [
      ["critical", "Move fan zone inside hold areas", "Close exposed fan-zone activations and open covered concourse overflow paths."],
      ["high", "Trigger weather script", "Publish calm delay notice with shelter, water, and accessible assistance locations."],
      ["medium", "Stage medical teams", "Place two roaming teams near transit and east concourse slip-risk hotspots."],
      ["medium", "Reduce generator load", "Shift idle outdoor screens to low-power mode while fans shelter."]
    ]
  },
  transitCrush: {
    label: "Transit crush",
    desc: "Post-match platform load forecast exceeds comfort threshold.",
    riskBoost: 14,
    waitBoost: 10,
    accessBoost: -2,
    wasteBoost: 1,
    zones: { north: 70, south: 64, west: 59, east: 72, transit: 94, fan: 61, bowl: 42 },
    actions: [
      ["critical", "Create timed exit waves", "Hold two bowl sectors for 7 minutes with entertainment and clear multilingual announcements."],
      ["high", "Open fan-walk buffer", "Activate signed walking route to secondary station and rideshare Zone C."],
      ["high", "Reserve accessible shuttles", "Keep accessible boarding lane protected until platform load drops below 78%."],
      ["medium", "Share forecast with transit ops", "Send 30 minute departure curve and request two extra train consists."]
    ]
  },
  sustainability: {
    label: "Waste spike",
    desc: "Compost contamination and bottled-water demand are rising.",
    riskBoost: 3,
    waitBoost: 2,
    accessBoost: 0,
    wasteBoost: -14,
    zones: { north: 55, south: 48, west: 61, east: 64, transit: 58, fan: 70, bowl: 46 },
    actions: [
      ["high", "Move green team to fan zone", "Reassign 10 volunteers to bin guidance and compost signage for the next 20 minutes."],
      ["medium", "Promote refill stations", "Generate app card that routes fans to low-wait refill points instead of bottled-water kiosks."],
      ["medium", "Switch vendor packaging alert", "Notify concession managers to check compostable stock at stands 14, 18, and 22."],
      ["low", "Summarize diversion impact", "Draft organizer brief with avoided waste and expected landfill reduction."]
    ]
  },
  volunteerGap: {
    label: "Volunteer gap",
    desc: "Late check-ins leave translation desks short staffed.",
    riskBoost: 7,
    waitBoost: 5,
    accessBoost: -2,
    wasteBoost: 0,
    zones: { north: 68, south: 50, west: 64, east: 73, transit: 63, fan: 45, bowl: 44 },
    actions: [
      ["high", "Rebalance language desks", "Move 6 multilingual volunteers from west concourse to north and east help points."],
      ["high", "Generate radio script", "Create short instructions for ushers handling lost fans and medical requests."],
      ["medium", "Activate QR help flow", "Promote app-based translation for non-urgent navigation questions."],
      ["medium", "Update supervisor roster", "Flag unfilled shifts and suggest nearby trained backups."]
    ]
  }
};

export const translations: Record<string, any> = {
  en: {
    label: "English",
    gateSurge: "For faster entry, please use South Gate if you are able. East Gate is open but crowded. Accessible assistance remains available at Transit Plaza and West Concourse.",
    accessReroute: "Step-free access near East Concourse is being rerouted. Please follow teal signs to the West lift bank or ask a mobility volunteer for cart support.",
    stormDelay: "Weather may slow entry. Please move to covered concourse areas and follow staff directions. Water, medical help, and accessible support remain available.",
    transitCrush: "After the match, exits will open in short waves to keep platforms comfortable. Follow the signs for rail, shuttle, rideshare, or the signed walking route.",
    sustainability: "Help keep this venue low waste. Use refill stations where possible and place compost, recycling, and landfill items in the signed bins.",
    volunteerGap: "Need help in your language? Scan the help QR code or visit the nearest staffed information point at North Gate or East Concourse."
  },
  es: {
    label: "Spanish",
    gateSurge: "Para entrar más rápido, use la Puerta Sur si puede. La Puerta Este está abierta, pero con mucha afluencia. La asistencia accesible sigue disponible en Transit Plaza y West Concourse.",
    accessReroute: "El acceso sin escalones cerca de East Concourse está desviado. Siga las señales color verde azulado hacia los ascensores del oeste o pida apoyo a un voluntario de movilidad.",
    stormDelay: "El clima puede retrasar el ingreso. Diríjase a zonas cubiertas y siga las indicaciones del personal. Hay agua, atención médica y apoyo accesible disponibles.",
    transitCrush: "Después del partido, las salidas se abrirán por grupos para mantener cómodas las plataformas. Siga las señales hacia tren, shuttle, rideshare o ruta peatonal.",
    sustainability: "Ayude a mantener el estadio con menos residuos. Use estaciones de recarga y coloque compost, reciclaje y basura en los contenedores señalizados.",
    volunteerGap: "¿Necesita ayuda en su idioma? Escanee el código QR de ayuda o visite el punto de información más cercano en North Gate o East Concourse."
  },
  fr: {
    label: "French",
    gateSurge: "Pour entrer plus vite, utilisez la porte sud si possible. La porte Est reste ouverte, mais elle est très chargée. L'assistance accessible reste disponible à Transit Plaza et West Concourse.",
    accessReroute: "L'accès sans marches près de East Concourse est dévié. Suivez les panneaux vert-bleu vers les ascenseurs ouest ou demandez une navette de mobilité.",
    stormDelay: "La météo peut ralentir l'entrée. Rejoignez les zones couvertes et suivez les consignes du personnel. Eau, soins et aide accessible restent disponibles.",
    transitCrush: "Après le match, les sorties seront ouvertes par vagues pour garder les quais fluides. Suivez les panneaux vers train, navette, covoiturage ou itinéraire piéton.",
    sustainability: "Aidez à réduire les déchets du site. Utilisez les points de recharge et déposez compost, recyclage et déchets dans les bacs indiqués.",
    volunteerGap: "Besoin d'aide dans votre langue ? Scannez le QR d'assistance ou allez au point information le plus proche à North Gate ou East Concourse."
  },
  ar: {
    label: "Arabic",
    gateSurge: "للدخول بشكل أسرع، يرجى استخدام البوابة الجنوبية إذا كان ذلك ممكناً. البوابة الشرقية مفتوحة لكنها مزدحمة. تتوفر المساعدة الميسرة في Transit Plaza و West Concourse.",
    accessReroute: "تم تغيير مسار الوصول دون درجات قرب East Concourse. يرجى اتباع العلامات باللون الأزرق المخضر إلى مصاعد الجهة الغربية أو طلب عربة مساعدة من متطوع الحركة.",
    stormDelay: "قد يؤدي الطقس إلى إبطاء الدخول. يرجى الانتقال إلى المناطق المغطاة واتباع تعليمات الموظفين. الماء والمساعدة الطبية والدعم الميسر متاحة.",
    transitCrush: "بعد المباراة، ستفتح المخارج على دفعات للحفاظ على راحة المنصات. اتبعوا اللافتات نحو القطار أو الحافلات أو منطقة مشاركة الركوب أو مسار المشي.",
    sustainability: "ساعدوا في تقليل النفايات في هذا الملعب. استخدموا محطات إعادة التعبئة وضعوا السماد والتدوير والنفايات في الحاويات المعلّمة.",
    volunteerGap: "هل تحتاج إلى مساعدة بلغتك؟ امسح رمز QR للمساعدة أو توجّه إلى أقرب نقطة معلومات عند North Gate أو East Concourse."
  },
  hi: {
    label: "Hindi",
    gateSurge: "तेज़ प्रवेश के लिए, यदि संभव हो तो South Gate का उपयोग करें। East Gate खुला है, लेकिन भीड़ अधिक है। सुलभ सहायता Transit Plaza और West Concourse पर उपलब्ध है।",
    accessReroute: "East Concourse के पास बिना सीढ़ी वाला मार्ग बदला गया है। कृपया नीले-हरे संकेतों का पालन करके पश्चिमी लिफ्ट बैंक तक जाएँ या मोबिलिटी स्वयंसेवक से कार्ट सहायता माँगें।",
    stormDelay: "मौसम के कारण प्रवेश धीमा हो सकता है। कृपया ढके हुए कॉनकोर्स क्षेत्रों में जाएँ और स्टाफ के निर्देशों का पालन करें। पानी, चिकित्सा सहायता और सुलभ समर्थन उपलब्ध हैं।",
    transitCrush: "मैच के बाद, प्लेटफॉर्म को आरामदायक रखने के लिए निकास चरणों में खोले जाएँगे। रेल, शटल, राइडशेयर या पैदल मार्ग के संकेतों का पालन करें।",
    sustainability: "इस venue को कम-कचरा रखने में मदद करें। रीफिल स्टेशन का उपयोग करें और कम्पोस्ट, रीसाइक्लिंग और लैंडफिल वस्तुओं को चिन्हित डिब्बों में डालें।",
    volunteerGap: "क्या आपको अपनी भाषा में मदद चाहिए? सहायता QR कोड स्कैन करें या North Gate या East Concourse के निकटतम सूचना केंद्र पर जाएँ।"
  },
  ja: {
    label: "Japanese",
    gateSurge: "より早く入場するには、可能であれば South Gate をご利用ください。East Gate は開いていますが混雑しています。アクセシブル支援は Transit Plaza と West Concourse で利用できます。",
    accessReroute: "East Concourse 付近の段差なしルートは迂回中です。青緑色の案内に従って西側エレベーターへ進むか、移動支援ボランティアにカート支援を依頼してください。",
    stormDelay: "天候により入場が遅れる可能性があります。屋根のあるコンコースへ移動し、スタッフの指示に従ってください。水、医療支援、アクセシブル支援は利用できます。",
    transitCrush: "試合後は、ホームの混雑を抑えるため出口を段階的に開放します。鉄道、シャトル、ライドシェア、徒歩ルートの案内に従ってください。",
    sustainability: "会場の廃棄物削減にご協力ください。給水ステーションを利用し、堆肥化、リサイクル、廃棄物は表示された容器へ入れてください。",
    volunteerGap: "ご希望の言語で支援が必要ですか。支援QRコードを読み取るか、North Gate または East Concourse の案内所へお越しください。"
  }
};

export const topologyKnowledge = [
  { id: "topo-east-gates", tags: ["gateSurge", "east", "ingress"], text: "East Gate connects to temporary lanes E4-E7, South Gate relief signage, and transit-plaza LED boards." },
  { id: "topo-access-west", tags: ["accessReroute", "accessibility", "elevator"], text: "If East Concourse lift bank E2 is degraded, route wheelchair users via Transit Plaza to the West lift bank and dispatch mobility carts." },
  { id: "policy-access-backup", tags: ["accessReroute", "stormDelay", "accessibility"], text: "Any elevator outage requires a physical backup dispatch, not only digital routing or app instructions." },
  { id: "topo-weather-shelter", tags: ["stormDelay", "weather", "shelter"], text: "Covered concourse hold areas can absorb weather delays; exposed fan-zone activations should close before lightning thresholds." },
  { id: "topo-transit-wave", tags: ["transitCrush", "transit", "exit"], text: "Post-match rail platforms are protected by timed exit waves, fan-walk buffers, rideshare Zone C, and accessible shuttle reserves." },
  { id: "topo-sustainability", tags: ["sustainability", "waste", "water"], text: "Green-team bin guidance, refill station routing, and vendor packaging checks improve diversion without increasing crowd load." },
  { id: "policy-multilingual", tags: ["volunteerGap", "language", "fan"], text: "Fan-facing guidance must be calm, multilingual, short, and separate from staff-only dispatch details." },
  { id: "policy-edge", tags: ["edge", "threshold", "safety"], text: "Density above 90%, route coverage below 90%, and corrupted telemetry are handled as edge alerts before LLM generation." },
  { id: "policy-fan-verification", tags: ["gateSurge", "transitCrush", "verification", "fan"], text: "Fan redirection messages must be verified with app opens, LED QR scans, geofenced movement, and gate count deltas within 10 minutes." },
  { id: "policy-local-fallback", tags: ["fallback", "safety", "edge"], text: "If LLM latency or connectivity degrades during a critical surge, execute deterministic local playbooks and continue schema-valid audit logging." }
];

export const decisionSchema = {
  required: ["id", "scenarioId", "venueId", "fanMessage", "multilingualMessages", "verification", "actions", "grounding", "guardrails", "edgeAlerts", "spatialChecks", "dispatchLock"],
  priorities: ["low", "medium", "high", "critical"],
  channels: ["app", "led", "radio", "volunteer-tablet", "transit-partner", "facilities", "sustainability-team"],
  bands: ["low", "watch", "high", "critical", "fallback"]
};

export const authorizedOperatorSessions: Record<string, string> = {
  "ops-supervisor-demo": "stadiumops-demo-signing-key"
};

export const zoneKeys = [
  ["north", "North Gate", "zoneNorthGate", "northDensity"],
  ["south", "South Gate", "zoneSouthGate", "southDensity"],
  ["west", "West Concourse", "zoneWestConcourse", "westDensity"],
  ["east", "East Concourse", "zoneEastConcourse", "eastDensity"],
  ["transit", "Transit Plaza", "zoneTransitPlaza", "transitDensity"],
  ["fan", "Fan Zone", "zoneFanZone", "fanDensity"],
  ["bowl", "Lower Bowl", "zoneLowerBowl", "bowlDensity"]
] as const;
