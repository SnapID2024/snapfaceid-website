'use client';

import { useState, useEffect } from 'react';

type VerifyState = 'input' | 'agreement' | 'viewing';

interface ReviewData {
  review_id: string;
  author_username: string;
  author_avatar_url?: string;
  author_preset_avatar_id?: number;
  review_preset_1: number;
  review_preset_2?: number;
  review_type: string;
  date_created: string;
  location?: string;
}

interface ProfileData {
  person_id: string;
  selfies: string[];
  numeros_telefono: string[];
  reviews: ReviewData[];
  created_at?: string;
}

interface TokenInfo {
  user_id: string;
  username: string;
  user_phone: string;
  user_language: string;
  person_id: string;
  expires_at: string;
}

// Preset avatars mapping
const presetAvatars: { [key: number]: string } = {
  1: '/avatars/1.png',
  2: '/avatars/2.png',
  3: '/avatars/3.png',
  4: '/avatars/4.png',
  5: '/avatars/5.png',
  6: '/avatars/6.png',
  7: '/avatars/7.png',
  8: '/avatars/8.png',
  9: '/avatars/9.png',
  10: '/avatars/10.png',
  11: '/avatars/11.png',
  12: '/avatars/12.png',
  13: '/avatars/13.png',
  14: '/avatars/14.png',
  15: '/avatars/15.png',
  16: '/avatars/16.png',
  17: '/avatars/17.png',
  18: '/avatars/18.png',
  19: '/avatars/19.png',
  20: '/avatars/20.png',
  21: '/avatars/21.png',
  22: '/avatars/22.png',
  23: '/avatars/23.png',
  24: '/avatars/24.png',
  25: '/avatars/25.png',
  26: '/avatars/26.png',
  27: '/avatars/27.png',
};

export default function VerifyPage() {
  const [state, setState] = useState<VerifyState>('input');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Verificar token
  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setError('Please enter a valid token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired token');
        setLoading(false);
        return;
      }

      setTokenInfo(data.tokenInfo);
      setTimeRemaining(data.expiresInSeconds);
      setState('agreement');
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Aceptar acuerdo y ver perfil
  const handleAcceptAgreement = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-token/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error loading profile');
        setLoading(false);
        return;
      }

      setProfileData(data.profile);
      setState('viewing');

      // Iniciar countdown
      startCountdown(data.expiresInSeconds);
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  const startCountdown = (seconds: number) => {
    setTimeRemaining(seconds);
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Expirado - volver al inicio
          setState('input');
          setToken('');
          setProfileData(null);
          setTokenInfo(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Formatear tiempo restante
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatear número de teléfono parcialmente oculto: +1786XXXXXX -> 786-XXX-0937
  const formatPhonePartial = (phone: string) => {
    // Limpiar el número
    const cleaned = phone.replace(/\D/g, '');

    // Si tiene código de país (+1), quitarlo
    const national = cleaned.length > 10 ? cleaned.slice(-10) : cleaned;

    if (national.length === 10) {
      const area = national.slice(0, 3);
      const last4 = national.slice(-4);
      return `${area}-XXX-${last4}`;
    }

    // Fallback: mostrar primeros 3 y últimos 4
    if (phone.length >= 7) {
      return `${phone.slice(0, 4)}...${phone.slice(-4)}`;
    }

    return phone;
  };

  // Formatear fecha con día y hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${dayName}, ${monthName} ${dayNum}, ${year} at ${hour12}:${minutes} ${ampm}`;
  };

  // Obtener avatar URL
  const getAvatarUrl = (review: ReviewData) => {
    if (review.author_avatar_url) {
      return review.author_avatar_url;
    }
    if (review.author_preset_avatar_id && presetAvatars[review.author_preset_avatar_id]) {
      return presetAvatars[review.author_preset_avatar_id];
    }
    return presetAvatars[1]; // Default avatar
  };

  // Get user language from token (set by the app user's preferences)
  const getUserLanguage = () => {
    if (!tokenInfo?.user_language) return 'en';
    const lang = tokenInfo.user_language;
    const supportedLangs = ['en', 'es', 'fr', 'pt', 'it', 'de', 'ru', 'zh'];
    return supportedLangs.includes(lang) ? lang : 'en';
  };

  // Review presets translations - must match mobile app exactly
  const reviewPresetsTranslations: { [lang: string]: { [key: number]: string } } = {
    en: {
      1: "Good person in general (nothing weird)",
      2: "Nervous person, completed the Date but left quickly",
      3: "Very generous (left me extra gift)",
      4: "Total Waste of time (didn't show up to the Date)",
      5: "Paid me an Uber to waste my time",
      6: "Doesn't respect my time or commitment",
      7: "During our meeting I lost my money or jewelry",
      8: "This person is dangerous and I felt in imminent danger",
      9: "Photo and address collector (waste of time)",
      10: "Works for a government institution",
      11: "Broke clown who bothers you late at night",
      12: "Lied about their legal age and I rejected them",
      13: "Very verbally aggressive",
      14: "Doesn't want to go through verification process",
      15: "Only uses inappropriate or very graphic language",
      16: "Sends photos of his private parts inappropriately",
      17: "Asks inappropriate sexual questions from first contact",
      18: "Not willing to cover basic date expenses",
      19: "Only suggests low-budget or casual places",
      20: "Makes plans but doesn't follow through (Waste of time)",
      21: "He's married or in a relationship and wants to go out with me",
      22: "Won't interact with anyone from their community they're all rude and uneducated",
      23: "Only seeks intimate content without intention to meet",
      24: "Physically unattractive person, but very good person",
      25: "Physically unpleasant as well as their personality",
      26: "Very sexy and pleasant person",
      27: "Very arrogant and difficult person to deal with",
      28: "Great time with this person, highly recommended",
      29: "Seems to be under the influence of narcotics, was not acting coherently",
      30: "Not the same person as in the photos",
      31: "Same person as in the photos 100% recommended",
      32: "Thief who waits for you to arrive to steal your money",
      33: "Local police operation who mistook me for a criminal.",
      34: "Flees from the restaurant without paying the bill",
      35: "Seems to be a safe and polite person",
      36: "I haven't seen in person, but always sends me gifts through digital payment apps",
      37: "Scammer trying to get money from you",
      38: "Very immature person, talks nonsense",
      39: "Doesn't want to do FaceTime or send verification photos",
      40: "Works on the police force and is always busy, never has time to meet with me",
    },
    es: {
      1: "Buena persona en general (nada raro)",
      2: "Persona nerviosa completo su cita (se fue rapido)",
      3: "Muy generoso (me dejo regalo extra)",
      4: "Perdida de tiempo total (no se presento a la cita)",
      5: "Me pago un Uber para desperdiciar mi tiempo",
      6: "No respeta mi tiempo ni mi compromiso",
      7: "En nuestro encuentro perdí mi dinero o joyas",
      8: "Esta persona es peligrosa y me sentí en peligro inminente",
      9: "Colector de fotos y direcciones (perdida de tiempo)",
      10: "Trabaja para una institucion del gobierno",
      11: "Payaso sin dinero que te molesta tarde en la noche",
      12: "Mintió sobre su edad legal y lo rechacé",
      13: "Muy agresivo verbalmente",
      14: "No quiere pasar proceso de verificacion",
      15: "Solo usa lenguaje inapropiado o muy grafico",
      16: "Envia fotos de sus partes privadas inapropiadamente",
      17: "Hace preguntas sexuales inapropiadas desde el primer contacto",
      18: "No está dispuesto a cubrir gastos básicos de la cita",
      19: "Solo sugiere lugares de bajo presupuesto o informales",
      20: "Hace planes pero no concreta nada (Perdida de tiempo)",
      21: "Esta casado o en una relacion sentimental y quiere salir conmigo",
      22: "No interactuo con nadie de su comunidad todos son rudos y mal educados",
      23: "Solo busca contenido íntimo sin intención de conocerme",
      24: "Persona de fisico feo, pero muy buena persona",
      25: "Persona fisicamente desagradable al igual que su personalidad",
      26: "Persona muy sexy y agradable",
      27: "Persona muy arrogante y dificil de tratar",
      28: "Se pasa muy buen tiempo con esta persona, muy recomendable",
      29: "Parece estar bajo influencia de narcóticos, no actuaba coherentemente",
      30: "No es la misma persona de las fotos",
      31: "Es la misma persona de las fotos 100% recomendada",
      32: "Es un ladron que espera que llegues para quitarte el dinero",
      33: "Operativo de la policía local que me confundió con un criminal.",
      34: "Sale huyendo del restaurante sin pagar la cuenta",
      35: "Parece ser una persona segura y educada",
      36: "No he visto en persona, pero siempre me envía regalos a través de apps de pago digital",
      37: "Estafador tratando de sacarte dinero",
      38: "Persona muy inmadura, habla cosas sin sentido",
      39: "No quiere hacer FaceTime o enviar fotos de verificación",
      40: "Trabaja en la policía y siempre está ocupado, nunca tiene tiempo para verme",
    },
    fr: {
      1: "Bonne personne en général (rien de bizarre)",
      2: "Personne nerveuse a terminé le rendez-vous (partie rapidement)",
      3: "Très généreux (m'a laissé un cadeau supplémentaire)",
      4: "Perte de temps totale (ne s'est pas présenté au rendez-vous)",
      5: "M'a payé un Uber pour perdre mon temps",
      6: "Ne respecte pas mon temps ni mon engagement",
      7: "Lors de notre rencontre j'ai perdu mon argent ou mes bijoux",
      8: "Cette personne est dangereuse et je me suis sentie en danger imminent",
      9: "Collectionneur de photos et d'adresses (perte de temps)",
      10: "Travaille pour une institution gouvernementale",
      11: "Clown fauché qui vous dérange tard le soir",
      12: "A menti sur son âge légal et je l'ai rejeté",
      13: "Très agressif verbalement",
      14: "Ne veut pas passer par le processus de vérification",
      15: "Utilise uniquement un langage inapproprié ou très graphique",
      16: "Envoie des photos de ses parties privées de manière inappropriée",
      17: "Pose des questions sexuelles inappropriées dès le premier contact",
      18: "Pas disposé à couvrir les frais de base du rendez-vous",
      19: "Suggère uniquement des endroits à petit budget ou informels",
      20: "Fait des plans mais ne concrétise rien (Perte de temps)",
      21: "Il est marié ou en couple et veut sortir avec moi",
      22: "N'interagis avec personne de leur communauté, ils sont tous grossiers et mal élevés",
      23: "Cherche uniquement du contenu intime sans intention de me rencontrer",
      24: "Personne physiquement peu attrayante, mais très bonne personne",
      25: "Physiquement désagréable ainsi que leur personnalité",
      26: "Personne très sexy et agréable",
      27: "Personne très arrogante et difficile à traiter",
      28: "Excellent moment avec cette personne, hautement recommandé",
      29: "Semble être sous l'influence de stupéfiants, n'agissait pas de manière cohérente",
      30: "Ce n'est pas la même personne que sur les photos",
      31: "C'est la même personne que sur les photos 100% recommandée",
      32: "Voleur qui attend que tu arrives pour te voler ton argent",
      33: "Opération de police locale qui m'a confondu avec un criminel.",
      34: "S'enfuit du restaurant sans payer l'addition",
      35: "Semble être une personne sûre et polie",
      36: "Je n'ai pas vu en personne, mais m'envoie toujours des cadeaux via des applications de paiement numérique",
      37: "Escroc essayant de vous soutirer de l'argent",
      38: "Personne très immature, dit des choses sans sens",
      39: "Ne veut pas faire FaceTime ou envoyer des photos de vérification",
      40: "Travaille dans la police et est toujours occupé, n'a jamais le temps de me rencontrer",
    },
    pt: {
      1: "Boa pessoa em geral (nada estranho)",
      2: "Pessoa nervosa completou o encontro (saiu rapidamente)",
      3: "Muito generoso (me deixou presente extra)",
      4: "Perda total de tempo (não apareceu no encontro)",
      5: "Me pagou um Uber para desperdiçar meu tempo",
      6: "Não respeita meu tempo nem meu compromisso",
      7: "Durante nosso encontro perdi meu dinheiro ou joias",
      8: "Esta pessoa é perigosa e me senti em perigo iminente",
      9: "Coletor de fotos e endereços (perda de tempo)",
      10: "Trabalha para uma instituição governamental",
      11: "Palhaço sem dinheiro que incomoda tarde da noite",
      12: "Mentiu sobre sua idade legal e eu o rejeitei",
      13: "Muito agressivo verbalmente",
      14: "Não quer passar pelo processo de verificação",
      15: "Usa apenas linguagem inapropriada ou muito gráfica",
      16: "Envia fotos de suas partes privadas de forma inadequada",
      17: "Faz perguntas sexuais inapropriadas desde o primeiro contato",
      18: "Não está disposto a cobrir despesas básicas do encontro",
      19: "Sugere apenas lugares de baixo orçamento ou informais",
      20: "Faz planos mas não concretiza nada (Perda de tempo)",
      21: "Ele é casado ou em um relacionamento e quer sair comigo",
      22: "Não interajo com ninguém de sua comunidade, todos são grosseiros e mal educados",
      23: "Busca apenas conteúdo íntimo sem intenção de me conhecer",
      24: "Pessoa fisicamente pouco atraente, mas muito boa pessoa",
      25: "Fisicamente desagradável assim como sua personalidade",
      26: "Pessoa muito sexy e agradável",
      27: "Pessoa muito arrogante e difícil de lidar",
      28: "Ótimo momento com esta pessoa, altamente recomendado",
      29: "Parece estar sob influência de narcóticos, não agia de forma coerente",
      30: "Não é a mesma pessoa das fotos",
      31: "É a mesma pessoa das fotos 100% recomendada",
      32: "Ladrão que espera você chegar para roubar seu dinheiro",
      33: "Operação da polícia local que me confundiu com um criminoso.",
      34: "Foge do restaurante sem pagar a conta",
      35: "Parece ser uma pessoa segura e educada",
      36: "Não vi pessoalmente, mas sempre me envia presentes através de apps de pagamento digital",
      37: "Golpista tentando tirar dinheiro de você",
      38: "Pessoa muito imatura, fala coisas sem sentido",
      39: "Não quer fazer FaceTime ou enviar fotos de verificação",
      40: "Trabalha na polícia e está sempre ocupado, nunca tem tempo para me encontrar",
    },
    it: {
      1: "Brava persona in generale (niente di strano)",
      2: "Persona nervosa ha completato l'appuntamento (è andata via velocemente)",
      3: "Molto generoso (mi ha lasciato un regalo extra)",
      4: "Totale perdita di tempo (non si è presentato all'appuntamento)",
      5: "Mi ha pagato un Uber per sprecare il mio tempo",
      6: "Non rispetta il mio tempo né il mio impegno",
      7: "Durante il nostro incontro ho perso i miei soldi o gioielli",
      8: "Questa persona è pericolosa e mi sono sentita in pericolo imminente",
      9: "Collezionista di foto e indirizzi (perdita di tempo)",
      10: "Lavora per un'istituzione governativa",
      11: "Pagliaccio al verde che ti disturba a tarda notte",
      12: "Ha mentito sulla sua età legale e l'ho rifiutato",
      13: "Molto aggressivo verbalmente",
      14: "Non vuole passare attraverso il processo di verifica",
      15: "Usa solo linguaggio inappropriato o molto grafico",
      16: "Invia foto delle sue parti private in modo inappropriato",
      17: "Fa domande sessuali inappropriate dal primo contatto",
      18: "Non è disposto a coprire le spese base dell'appuntamento",
      19: "Suggerisce solo luoghi a basso budget o informali",
      20: "Fa piani ma non conclude nulla (Perdita di tempo)",
      21: "È sposato o in una relazione e vuole uscire con me",
      22: "Non interagisco con nessuno della loro comunità, sono tutti rozzi e maleducati",
      23: "Cerca solo contenuti intimi senza intenzione di conoscermi",
      24: "Persona fisicamente poco attraente, ma persona molto buona",
      25: "Fisicamente sgradevole così come la loro personalità",
      26: "Persona molto sexy e piacevole",
      27: "Persona molto arrogante e difficile da trattare",
      28: "Ottimo momento con questa persona, altamente raccomandato",
      29: "Sembra essere sotto l'influenza di stupefacenti, non agiva in modo coerente",
      30: "Non è la stessa persona delle foto",
      31: "È la stessa persona delle foto 100% raccomandato",
      32: "Ladro che aspetta che tu arrivi per rubarti i soldi",
      33: "Operazione della polizia locale che mi ha scambiato per un criminale.",
      34: "Fugge dal ristorante senza pagare il conto",
      35: "Sembra essere una persona sicura e educata",
      36: "Non ho visto di persona, ma mi invia sempre regali tramite app di pagamento digitale",
      37: "Truffatore che cerca di spillarti soldi",
      38: "Persona molto immatura, dice cose senza senso",
      39: "Non vuole fare FaceTime o inviare foto di verifica",
      40: "Lavora nella polizia ed è sempre occupato, non ha mai tempo di incontrarmi",
    },
    de: {
      1: "Gute Person im Allgemeinen (nichts Seltsames)",
      2: "Nervöse Person hat Termin abgeschlossen (schnell gegangen)",
      3: "Sehr großzügig (hat mir ein zusätzliches Geschenk hinterlassen)",
      4: "Totale Zeitverschwendung (ist nicht zum Termin erschienen)",
      5: "Hat mir ein Uber bezahlt, um meine Zeit zu verschwenden",
      6: "Respektiert meine Zeit und Verpflichtung nicht",
      7: "Bei unserem Treffen habe ich mein Geld oder Schmuck verloren",
      8: "Diese Person ist gefährlich und ich fühlte mich in unmittelbarer Gefahr",
      9: "Sammler von Fotos und Adressen (Zeitverschwendung)",
      10: "Arbeitet für eine Regierungsinstitution",
      11: "Pleite Clown, der Sie spät nachts belästigt",
      12: "Hat über sein legales Alter gelogen und ich habe ihn abgelehnt",
      13: "Sehr verbal aggressiv",
      14: "Will nicht durch den Verifizierungsprozess gehen",
      15: "Verwendet nur unangemessene oder sehr grafische Sprache",
      16: "Sendet unangemessen Fotos seiner Intimbereich",
      17: "Stellt vom ersten Kontakt an unangemessene sexuelle Fragen",
      18: "Nicht bereit, grundlegende Verabredungskosten zu decken",
      19: "Schlägt nur günstige oder zwanglose Orte vor",
      20: "Macht Pläne, aber setzt nichts um (Zeitverschwendung)",
      21: "Er ist verheiratet oder in einer Beziehung und will mit mir ausgehen",
      22: "Interagiere mit niemandem aus ihrer Gemeinschaft, sie sind alle unhöflich und ungebildet",
      23: "Sucht nur intime Inhalte ohne die Absicht, mich kennenzulernen",
      24: "Körperlich unattraktive Person, aber sehr gute Person",
      25: "Körperlich unangenehm sowie ihre Persönlichkeit",
      26: "Sehr sexy und angenehme Person",
      27: "Sehr arrogante und schwierige Person",
      28: "Tolle Zeit mit dieser Person, sehr zu empfehlen",
      29: "Scheint unter dem Einfluss von Betäubungsmitteln zu stehen, handelte nicht kohärent",
      30: "Nicht dieselbe Person wie auf den Fotos",
      31: "Dieselbe Person wie auf den Fotos 100% empfohlen",
      32: "Dieb der wartet bis du ankommst um dein Geld zu stehlen",
      33: "Lokale Polizeioperation, die mich mit einem Kriminellen verwechselt hat.",
      34: "Flieht aus dem Restaurant ohne die Rechnung zu bezahlen",
      35: "Scheint eine sichere und höfliche Person zu sein",
      36: "Nicht persönlich gesehen, aber schickt mir immer Geschenke über digitale Zahlungs-Apps",
      37: "Betrüger der versucht dir Geld abzunehmen",
      38: "Sehr unreife Person, redet Unsinn",
      39: "Möchte kein FaceTime machen oder Verifizierungsfotos senden",
      40: "Arbeitet bei der Polizei und ist immer beschäftigt, hat nie Zeit mich zu treffen",
    },
    ru: {
      1: "Хороший человек в целом (ничего странного)",
      2: "Нервный человек завершил встречу (быстро ушел)",
      3: "Очень щедрый (оставил мне дополнительный подарок)",
      4: "Полная потеря времени (не пришел на встречу)",
      5: "Оплатил мне Uber, чтобы потратить мое время",
      6: "Не уважает мое время и обязательства",
      7: "Во время нашей встречи я потеряла деньги или украшения",
      8: "Этот человек опасен и я почувствовала себя в непосредственной опасности",
      9: "Коллекционер фотографий и адресов (потеря времени)",
      10: "Работает в правительственном учреждении",
      11: "Клоун без денег, который беспокоит вас поздно ночью",
      12: "Солгал о своем возрасте и я его отвергла",
      13: "Очень вербально агрессивный",
      14: "Не хочет проходить процесс верификации",
      15: "Использует только неприемлемый или очень графический язык",
      16: "Отправляет фотографии своих интимных частей неуместно",
      17: "Задает неуместные сексуальные вопросы с первого контакта",
      18: "Не готов покрывать базовые расходы на свидание",
      19: "Предлагает только бюджетные или неформальные места",
      20: "Строит планы, но ничего не доводит до конца (Потеря времени)",
      21: "Он женат или в отношениях и хочет встречаться со мной",
      22: "Не взаимодействую ни с кем из их сообщества, все грубы и невоспитанны",
      23: "Ищет только интимный контент без намерения познакомиться",
      24: "Физически непривлекательный человек, но очень хороший человек",
      25: "Физически неприятный, как и их личность",
      26: "Очень сексуальный и приятный человек",
      27: "Очень высокомерный и трудный человек",
      28: "Отличное время с этим человеком, настоятельно рекомендуется",
      29: "Похоже находится под воздействием наркотиков, действовал неадекватно",
      30: "Не тот же человек что на фотографиях",
      31: "Тот же человек что на фото 100% рекомендуется",
      32: "Вор который ждет пока ты приедешь чтобы украсть твои деньги",
      33: "Операция местной полиции, которая приняла меня за преступника.",
      34: "Убегает из ресторана, не оплатив счет",
      35: "Кажется безопасным и вежливым человеком",
      36: "Не видела лично, но всегда присылает подарки через приложения цифровых платежей",
      37: "Мошенник пытающийся выманить у тебя деньги",
      38: "Очень незрелый человек, говорит бессмыслицу",
      39: "Не хочет делать FaceTime или отправлять фото для верификации",
      40: "Работает в полиции и всегда занят, никогда нет времени встретиться",
    },
    zh: {
      1: "总体上是好人（没什么奇怪的）",
      2: "紧张的人完成了约会（很快就走了）",
      3: "非常慷慨（给我留了额外的礼物）",
      4: "完全浪费时间（没有出现在约会）",
      5: "付了我的优步来浪费我的时间",
      6: "不尊重我的时间和承诺",
      7: "在我们的会面中我丢失了钱或珠宝",
      8: "这个人很危险，我感到自己处于紧迫危险中",
      9: "照片和地址收集者（浪费时间）",
      10: "为政府机构工作",
      11: "深夜骚扰你的身无分文的小丑",
      12: "谎报了法定年龄，我拒绝了他",
      13: "非常言语激进",
      14: "不想通过验证流程",
      15: "只使用不当或非常露骨的语言",
      16: "不当地发送他的私处照片",
      17: "从第一次接触就问不恰当的性问题",
      18: "不愿意承担约会的基本费用",
      19: "只建议低预算或非正式的场所",
      20: "制定计划但不兑现（浪费时间）",
      21: "他已婚或在恋爱中却想和我约会",
      22: "不与他们社区的任何人互动，他们都粗鲁且没教养",
      23: "只寻求亲密内容而无意了解我",
      24: "外表不吸引人但人很好",
      25: "外表和个性都令人不快",
      26: "非常性感和令人愉快的人",
      27: "非常傲慢且难以相处的人",
      28: "与此人度过美好时光，强烈推荐",
      29: "似乎受到毒品影响，行为不连贯",
      30: "不是照片中的同一个人",
      31: "与照片中是同一个人 100%推荐",
      32: "等你到达后抢劫你钱财的小偷",
      33: "当地警察行动，把我误认为是罪犯。",
      34: "逃离餐厅不付账单",
      35: "似乎是一个安全有礼貌的人",
      36: "没有亲自见过，但总是通过数字支付应用给我送礼物",
      37: "试图骗取你钱财的骗子",
      38: "非常不成熟的人，说话毫无意义",
      39: "不愿意进行FaceTime或发送验证照片",
      40: "在警察局工作，总是很忙，从来没有时间见面",
    },
  };

  // Get preset text in user's language (from app preferences)
  const getPresetText = (presetId: number) => {
    const lang = getUserLanguage();
    const langPresets = reviewPresetsTranslations[lang] || reviewPresetsTranslations.en;
    return langPresets[presetId] || `Report #${presetId}`;
  };

  // Detectar screenshot (limitado pero puede disuadir)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state === 'viewing') {
        // Usuario cambió de pestaña o minimizó - posible screenshot
        console.log('Visibility changed while viewing');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col">
      {/* Header minimalista sin nombre de app */}
      <header className="bg-[#1a1a2e]/80 backdrop-blur-sm text-white py-3 px-4 flex items-center justify-center sticky top-0 z-50 safe-area-top border-b border-white/10">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-semibold text-sm tracking-wide">Secure Verification Portal</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col px-4 py-6 overflow-auto">
        <div className="w-full max-w-lg mx-auto flex-grow flex flex-col">

          {/* Estado: Input de Token */}
          {state === 'input' && (
            <div className="bg-white/95 backdrop-blur rounded-3xl p-6 shadow-2xl flex-grow flex flex-col">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F59E0B]/10 rounded-full mb-4">
                  <svg className="w-8 h-8 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Enter Access Token
                </h1>
                <p className="text-gray-500 text-sm">
                  Paste the token from your app
                </p>
              </div>

              <div className="flex-grow flex flex-col justify-center space-y-5">
                <div>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full px-4 py-5 text-center text-2xl font-mono tracking-[0.3em] border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] uppercase bg-gray-50 transition-all"
                    maxLength={14}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-shake">
                    <p className="text-red-600 text-center text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleVerifyToken}
                  disabled={loading || !token.trim()}
                  className="w-full bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] disabled:bg-gray-300 disabled:scale-100 text-white py-5 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-[#F59E0B]/30"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Tokens expire in 5 minutes and can only be used once.
                </p>
              </div>
            </div>
          )}

          {/* Estado: Acuerdo Legal */}
          {state === 'agreement' && tokenInfo && (
            <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl flex-grow flex flex-col overflow-hidden">
              <div className="bg-red-500 p-3">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold text-white text-sm">Legal Agreement Required</span>
                </div>
              </div>

              <div className="flex-grow overflow-auto p-5">
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="text-gray-700 font-medium">
                    By continuing you acknowledge:
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-red-500 font-bold">•</span>
                      <p className="text-xs text-gray-600">You will NOT share, screenshot, or distribute this information.</p>
                    </div>

                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-red-500 font-bold">•</span>
                      <p className="text-xs text-gray-600">For personal safety verification only. No harassment or illegal use.</p>
                    </div>

                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-red-500 font-bold">•</span>
                      <p className="text-xs text-gray-600">Violations may result in legal prosecution.</p>
                    </div>

                    <div className="flex gap-3 bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                      <span className="text-yellow-600 font-bold">!</span>
                      <p className="text-xs text-yellow-800">All activity is logged and tracked.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="bg-red-100 rounded-xl p-3 mb-4">
                  <p className="text-red-800 text-center text-sm font-semibold">
                    Expires in {formatTime(timeRemaining)}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-600 text-center text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setState('input');
                      setToken('');
                      setTokenInfo(null);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 active:scale-[0.98] text-gray-700 py-4 rounded-2xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcceptAgreement}
                    disabled={loading}
                    className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold transition-all shadow-lg"
                  >
                    {loading ? 'Loading...' : 'I Agree'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Estado: Viendo Perfil */}
          {state === 'viewing' && profileData && tokenInfo && (
            <div className="flex-grow flex flex-col space-y-4 select-none no-screenshot" style={{ WebkitUserSelect: 'none' }}>
              {/* Countdown header sticky */}
              <div className="bg-red-600 text-white rounded-2xl p-3 flex items-center justify-center sticky top-0 z-20 shadow-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
                </div>
              </div>

              {/* Fotos - Últimas 3, horizontal */}
              {profileData.selfies && profileData.selfies.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                  <div className="flex gap-2 justify-center overflow-x-auto">
                    {profileData.selfies.slice(-3).map((url, idx) => (
                      <div key={idx} className="relative flex-shrink-0 w-28 h-28">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover rounded-xl blur-on-screenshot"
                          onContextMenu={(e) => e.preventDefault()}
                          draggable={false}
                        />
                        {/* Watermark overlay with user phone for tracking */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10 rounded-xl">
                          <span className="text-white/40 text-[8px] font-bold rotate-[-25deg] select-none text-center leading-tight">
                            provided by<br/>{tokenInfo.user_phone || 'user'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teléfonos - Últimos 3, formato vertical con fecha */}
              {profileData.numeros_telefono && profileData.numeros_telefono.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Associated Numbers</h3>
                    {profileData.created_at && (
                      <span className="text-[10px] text-gray-400">
                        First reported: {new Date(profileData.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {profileData.numeros_telefono.slice(-3).reverse().map((phone, idx) => (
                      <div key={idx} className="bg-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="font-mono text-sm text-gray-700">{formatPhonePartial(phone)}</span>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400">#{profileData.numeros_telefono.length - idx}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews con avatar, location, time */}
              {profileData.reviews && profileData.reviews.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Reports ({profileData.reviews.length})
                  </h3>
                  <div className="space-y-3">
                    {profileData.reviews.slice(-5).map((review, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-3">
                        {/* Header con avatar y info */}
                        <div className="flex items-start gap-3 mb-2">
                          <img
                            src={getAvatarUrl(review)}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = presetAvatars[1];
                            }}
                          />
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm">@{review.author_username}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                review.review_type === 'inperson'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {review.review_type === 'inperson' ? 'IN-PERSON' : 'REMOTE'}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {formatDateTime(review.date_created)}
                            </div>
                            {review.location && (
                              <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {review.location}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contenido del reporte */}
                        <div className="ml-13 space-y-1">
                          <p className="text-gray-700 text-xs">
                            • {getPresetText(review.review_preset_1)}
                          </p>
                          {review.review_preset_2 && (
                            <p className="text-gray-700 text-xs">
                              • {getPresetText(review.review_preset_2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer warning */}
              <div className="bg-gray-900/90 backdrop-blur text-white rounded-2xl p-4 text-center">
                <p className="text-xs font-medium">CONFIDENTIAL - Activity logged</p>
                <p className="text-[10px] opacity-60 mt-1">Unauthorized distribution is prohibited</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CSS para mobile y protecciones anti-screenshot */}
      <style jsx global>{`
        /* Safe area padding for notched phones */
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0px);
        }

        /* Prevent pull-to-refresh */
        body {
          overscroll-behavior-y: contain;
        }

        /* Disable text selection */
        .select-none {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }

        /* Disable image save on long press */
        img {
          -webkit-touch-callout: none;
          pointer-events: none;
        }

        /* Anti-screenshot techniques */
        .no-screenshot {
          -webkit-filter: none;
        }

        /* Blur images on screenshot attempt (experimental) */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          .blur-on-screenshot {
            /* This creates a protective layer */
            filter: contrast(1.0001);
          }
        }

        /* Disable print completely */
        @media print {
          body * {
            display: none !important;
            visibility: hidden !important;
          }
          body::after {
            content: "Printing disabled";
            display: block !important;
            visibility: visible !important;
            font-size: 24px;
            text-align: center;
            padding: 100px;
          }
        }

        /* Disable screenshot on iOS Safari (experimental) */
        .no-screenshot img {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
        }

        /* Shake animation for errors */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        /* Hide scrollbar but allow scrolling */
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Prevent context menu on images */
        img {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -o-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
