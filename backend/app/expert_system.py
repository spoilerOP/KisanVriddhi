from typing import List, Dict, Any, Tuple
from app.schemas import ExpertQuestion

# Diagnostic questions list
DIAGNOSTIC_QUESTIONS = [
    ExpertQuestion(
        key="yellow_leaves",
        text_en="Are the leaves turning yellow?",
        text_hi="क्या पत्तियाँ पीली हो रही हैं?",
        text_ml="ഇലകൾ മഞ്ഞനിറമാകുന്നുണ്ടോ?",
        text_te="ఆకులు పసుపు రంగులోకి మారుతున్నాయా?"
    ),
    ExpertQuestion(
        key="brown_spots",
        text_en="Are there dark brown spots or patches on the leaves?",
        text_hi="क्या पत्तियों पर गहरे भूरे रंग के धब्बे या पैच हैं?",
        text_ml="ഇലകളിൽ കടും തവിട്ടുനിറത്തിലുള്ള പാടുകൾ ഉണ്ടോ?",
        text_te="ఆకులపై ముదురు గోధుమ రంగు మచ్చలు ఉన్నాయా?"
    ),
    ExpertQuestion(
        key="leaf_curling",
        text_en="Are the leaves curling, rolling, or folding up?",
        text_hi="क्या पत्तियाँ मुड़ या सिकुड़ रही हैं?",
        text_ml="ഇലകൾ ചുരുളുകയോ മടങ്ങുകയോ ചെയ്യുന്നുണ്ടോ?",
        text_te="ఆకులు ముడుచుకుపోతున్నాయా?"
    ),
    ExpertQuestion(
        key="rust_spots",
        text_en="Are there orange, yellow, or reddish-brown powdery spots?",
        text_hi="क्या नारंगी, पीले या लाल-भूरे रंग के पाउडर जैसे धब्बे हैं?",
        text_ml="ഓറഞ്ച്, മഞ്ഞ, അല്ലെങ്കിൽ ചുവപ്പ്-തവിട്ട് നിറത്തിലുള്ള പൊടിപോലെയുള്ള പാടുകൾ ഉണ്ടോ?",
        text_te="నారింజ, పసుపు, లేదా ఎరుపు-గోధుమ రంగు పొడి మచ్చలు ఉన్నాయా?"
    ),
    ExpertQuestion(
        key="white_insects",
        text_en="Are there tiny white insects on the undersides of the leaves?",
        text_hi="क्या पत्तियों के निचले हिस्से में छोटे सफेद कीड़े हैं?",
        text_ml="ഇലകളുടെ അടിവശത്ത് ചെറിയ വെളുത്ത പ്രാണികൾ ഉണ്ടോ?",
        text_te="ఆకుల వెనుక భాగంలో చిన్న తెల్లటి పురుగులు ఉన్నాయా?"
    ),
    ExpertQuestion(
        key="stem_holes",
        text_en="Are there holes or tunnels bored into the stems?",
        text_hi="क्या तनों में छेद या सुरंगें बनी हुई हैं?",
        text_ml="തണ്ടുകളിൽ സുഷിരങ്ങളോ തുരങ്കങ്ങളോ കാണുന്നുണ്ടോ?",
        text_te="కాండంలో రంధ్రాలు లేదా సొరంగాలు ఉన్నాయా?"
    )
]

# Database of crop diseases, expert rules, and treatment recommendations
DISEASE_RULES = [
    {
        "disease_name": "Rice Blast (Fungal)",
        "crop": "Rice",
        "required_symptoms": ["brown_spots", "yellow_leaves"],
        "confidence": 0.85,
        "reasoning": "The presence of dark brown, spindle-shaped spots on yellowing rice leaves strongly matches Rice Blast (caused by Magnaporthe oryzae). Fungal spores typically spread during warm, damp weather with high humidity.",
        "treatment": "Apply Tricyclazole 75 WP at 0.6 g/liter of water. Keep water levels regular; avoid excessive nitrogen fertilizers."
    },
    {
        "disease_name": "Rice Leaf Folder",
        "crop": "Rice",
        "required_symptoms": ["leaf_curling", "yellow_leaves"],
        "confidence": 0.80,
        "reasoning": "Leaves folded longitudinally with yellow margin degradation suggest Rice Leaf Folder caterpillars. The larvae spin threads to fold the leaf and feed on the green tissue from inside.",
        "treatment": "Release Trichogramma chilonis parasites at 5 cards/ha. Spray Cartap Hydrochloride 50 SP at 1 g/liter if infestation is severe."
    },
    {
        "disease_name": "Rice Nitrogen Deficiency",
        "crop": "Rice",
        "required_symptoms": ["yellow_leaves"],
        "excluded_symptoms": ["brown_spots", "leaf_curling"],
        "confidence": 0.70,
        "reasoning": "Uniform yellowing of leaves starting from the tips indicates Nitrogen Deficiency. Without pathogen-specific symptoms like spots or curling, this is a soil nutrient depletion issue.",
        "treatment": "Apply top dressing of Urea (30-40 kg/acre) in split doses. Ensure proper soil moisture."
    },
    {
        "disease_name": "Wheat Leaf Rust (Fungal)",
        "crop": "Wheat",
        "required_symptoms": ["rust_spots", "yellow_leaves"],
        "confidence": 0.90,
        "reasoning": "Orange or reddish-brown powdery rust pustules on yellowing leaves indicate Wheat Leaf Rust infection (Puccinia triticina). Spores blow across fields under humid conditions.",
        "treatment": "Spray Propiconazole 25 EC at 1 ml/liter of water. Avoid late sowing and choose resistant varieties like HD 2967."
    },
    {
        "disease_name": "Wheat Septoria Blight",
        "crop": "Wheat",
        "required_symptoms": ["brown_spots"],
        "excluded_symptoms": ["rust_spots"],
        "confidence": 0.75,
        "reasoning": "Irregular dark brown patches on lower wheat leaves suggest Septoria Blight. Fungal cells splash from soil debris during winter rains.",
        "treatment": "Spray Mancozeb 75 WP at 2 g/liter of water. Practice crop rotation and bury crop residues."
    },
    {
        "disease_name": "Cotton Whitefly Infestation",
        "crop": "Cotton",
        "required_symptoms": ["white_insects", "leaf_curling"],
        "confidence": 0.85,
        "reasoning": "Tiny white insects visible on the underside of curling leaves indicate a Whitefly colony. Sucking damage causes downward leaf curling and leaves sticky honey-dew secretions.",
        "treatment": "Spray Neem Oil (1500 ppm) at 5 ml/liter or Diafenthiuron 50 WP at 1.2 g/liter of water. Remove alternative weed hosts."
    },
    {
        "disease_name": "Cotton Leaf Curl Virus",
        "crop": "Cotton",
        "required_symptoms": ["leaf_curling", "yellow_leaves"],
        "excluded_symptoms": ["white_insects"],
        "confidence": 0.80,
        "reasoning": "Upward leaf curling and thick yellow margins in the absence of whiteflies suggests the viral Leaf Curl infection, typically vector-borne in warm climates.",
        "treatment": "Uproot and burn infected plants early. Control Whitefly vectors using approved insecticidal sprays. Grow curl-virus resistant hybrids."
    },
    {
        "disease_name": "Maize Stem Borer",
        "crop": "Maize",
        "required_symptoms": ["stem_holes", "yellow_leaves"],
        "confidence": 0.88,
        "reasoning": "Symmetrical holes and tunnels bored into the stalks along with leaves yellowing indicate Stem Borer caterpillars tunneling. This blocks internal nutrient transport.",
        "treatment": "Whorl application of Carbofuran 3G granules at 3 kg/acre. Intercrop with cowpea or soybean to reduce pest density."
    },
    {
        "disease_name": "Maize Northern Leaf Blight",
        "crop": "Maize",
        "required_symptoms": ["brown_spots"],
        "excluded_symptoms": ["stem_holes"],
        "confidence": 0.75,
        "reasoning": "Elongated, cigar-shaped greyish-brown spots on leaves suggest Northern Leaf Blight infection. Wet conditions and high wind speed accelerate spore spreading.",
        "treatment": "Spray Mancozeb at 2 g/liter of water. Practice balanced nitrogen application and ensure proper field sanitation."
    }
]

def run_expert_diagnosis(
    crop_type: str,
    active_symptoms: List[str]
) -> Tuple[str, float, str, List[str], str]:
    """
    Evaluates current crop, inputs active symptoms, runs the rule engine,
    and returns (disease_name, confidence, treatment, matched_symptoms, reasoning).
    """
    best_match = None
    max_score = 0.0
    matched_symptoms_list = []

    symptom_set = set(active_symptoms)

    for rule in DISEASE_RULES:
        if crop_type and rule["crop"].lower() not in crop_type.lower():
            continue

        req_syms = rule["required_symptoms"]
        ex_syms = rule.get("excluded_symptoms", [])

        has_req = all(s in symptom_set for s in req_syms)
        has_ex = any(s in symptom_set for s in ex_syms)

        if has_req and not has_ex:
            # Base confidence of the match
            score = rule["confidence"]
            # Add bonus confidence if more symptoms fit the profile
            if len(symptom_set) == len(req_syms):
                score += 0.05
            score = min(score, 1.0)
            
            if score > max_score:
                max_score = score
                best_match = rule
                matched_symptoms_list = req_syms

    if best_match:
        return (
            best_match["disease_name"],
            max_score,
            best_match["treatment"],
            matched_symptoms_list,
            best_match["reasoning"]
        )

    if symptom_set:
        return (
            "Suspected Fungal Infection / Nutrient Deficiency",
            0.50,
            "Consult a local agricultural officer. Keep the crop well-aerated, avoid waterlogging, and apply organic compost.",
            list(symptom_set),
            "Multiple symptoms detected, but they do not match a specific disease signature in our agricultural rules catalog. Requires manual audit."
        )

    return (
        "Healthy Crop / Undetermined Condition",
        1.0,
        "No specific treatment required. Maintain standard watering and fertilization schedules.",
        [],
        "No symptoms detected on the plant foliage. The crop appears healthy."
    )
