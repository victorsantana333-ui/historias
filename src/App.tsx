/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  Share2, 
  MapPin, 
  AlertTriangle, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  QrCode, 
  Play, 
  Volume2, 
  VolumeX, 
  FileText, 
  Info, 
  Smartphone, 
  Instagram, 
  Facebook, 
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
  Pencil,
  Camera,
  Bell,
  HelpCircle,
  MessageSquare,
  Lock,
  Menu,
  CreditCard,
  Activity,
  User,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDonation, money } from './useDonation';
import { useCampaign } from './useCampaign';

// Custom Pix Logo Icon
const PixIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.4 2.1c-.2-.1-.6-.1-.8 0L2.1 11.6c-.1.1-.1.5 0 .7l9.5 9.5c.1.1.5.1.7 0l9.5-9.5c.1-.1.1-.5 0-.7L12.4 2.1zm-.4 3.7l6.1 6.1-6.1 6.1-6.1-6.1 6.1-6.1z" />
    <path d="M12 7.7L7.7 12 12 16.3 16.3 12 12 7.7zm0 2.2l2.1 2.1-2.1 2.1-2.1-2.1 2.1-2.1z" />
  </svg>
);

interface Supporter {
  name: string;
  value: string;
  time: string;
  isNew?: boolean;
}

export default function App() {
  // Campaign state
  const goalAmount = 288000;
  const { raisedAmount, supporterCount, supporters: campaignSupporters, notice } = useCampaign();
  const supporters: Supporter[] = campaignSupporters;
  const percentReached = Math.min(Math.round((raisedAmount / goalAmount) * 100), 100);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Video state
  const [showVideoOverlay, setShowVideoOverlay] = useState<boolean>(true);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Gallery state
  const galleryImages = [
    "https://ajude.historiasunicasbrasil.com.br/miguel/imagens/5.jpeg",
    "https://ajude.historiasunicasbrasil.com.br/miguel/imagens/4.jpeg",
    "https://ajude.historiasunicasbrasil.com.br/miguel/imagens/3.jpeg",
    "https://ajude.historiasunicasbrasil.com.br/miguel/imagens/2.jpeg",
    "https://ajude.historiasunicasbrasil.com.br/miguel/imagens/1.jpeg"
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // FAQ state
  const [faqOpen, setFaqOpen] = useState<number[]>([0]); // Open first by default

  // Donation Modal state
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);
  const [donationStep, setDonationStep] = useState<number>(1); // 1: Value, 2: Payer and quote, 3: Pix, 4: Confirmed
  const [selectedPreset, setSelectedPreset] = useState<string>("R$ 100");
  const [customValue, setCustomValue] = useState<string>("");
  const [turbinarDoacao, setTurbinarDoacao] = useState<boolean>(false);
  const [pixCopiado, setPixCopiado] = useState<boolean>(false);

  // General state
  const [shareToast, setShareToast] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("A História");

  const [payerTaxNumber, setPayerTaxNumber] = useState("");

  // Menu items from JSON
  const menuItems = [
    { label: "A História", id: "historia" },
    { label: "Fotos", id: "fotos" },
    { label: "Despesas", id: "despesas" },
    { label: "Impacto da Doação", id: "impacto" },
    { label: "Quem Ajudou", id: "apoiadores" },
    { label: "Atualizações", id: "atualizacoes" },
    { label: "Perguntas Frequentes", id: "faq" }
  ];

  // Expenses estimation (Despesas)
  const expenses = [
    { item: "Remédio Mensal (Neurofibromatose)", value: "R$ 70.000", percentage: "80%", description: "Medicamento essencial para conter o avanço dos tumores e aliviar fortes dores." },
    { item: "Reforma e Adequação do Lar", value: "R$ 12.000", percentage: "14%", description: "Eliminação de infiltrações, mofo extremo e melhoria de acessibilidade para o Miguel." },
    { item: "Exames de Acompanhamento & Logística", value: "R$ 5.500", percentage: "6%", description: "Viagens para hospitais especializados e exames genéticos não cobertos." },
  ];

  // Handle video playback
  const handlePlayVideo = (fromBeginning: boolean) => {
    setShowVideoOverlay(false);
    setIsVideoPlaying(true);
    if (videoRef.current) {
      if (fromBeginning) {
        videoRef.current.currentTime = 0;
      }
      videoRef.current.muted = false;
      setIsVideoMuted(false);
      videoRef.current.play().catch(e => console.log("Video play failed: ", e));
    }
  };

  const toggleMuteVideo = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  };

  const handleCopyPix = (keyText: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(keyText).then(() => {
    setCopiedState(true);
    setTimeout(() => {
      setCopiedState(false);
    }, 3000);
    }).catch(() => alert("Não foi possível copiar. Selecione e copie o código manualmente."));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Histórias Únicas — Apoie o Luiz Miguel",
        text: "Um pai luta para salvar o filho de 8 anos. Juntos, podemos garantir o remédio e reformar o lar de Luiz Miguel.",
        url: window.location.href,
      }).catch(err => {
        console.log(err);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3500);
    }
  };

  // Helper to get normalized donation amount with minimum R$ 5
  const getDonationAmount = (): number => {
    if (selectedPreset && selectedPreset !== "Outro Valor") {
      const val = parseFloat(selectedPreset.replace("R$ ", "")) || 30;
      return Math.max(5, val);
    }
    const parsed = parseFloat(customValue.replace(/\./g, "").replace(",", "."));
    if (isNaN(parsed) || parsed < 5) {
      return 5;
    }
    return parsed;
  };

  const parsedCustomValue = parseFloat(customValue.replace(/\./g, "").replace(",", "."));
  const isCustomValueBelowMin = customValue.trim() !== "" && (isNaN(parsedCustomValue) || parsedCustomValue < 5);
  const isContinueDisabled = (!selectedPreset && !customValue.trim()) || (customValue.trim() !== "" && isCustomValueBelowMin);

  const amountCents = Math.round(getDonationAmount() * 100) + (turbinarDoacao ? 499 : 0);
  const donation = useDonation(amountCents, isDonationModalOpen && donationStep === 2);
  useEffect(() => {
    if (donation.payment) setDonationStep(donation.paid ? 4 : 3);
  }, [donation.payment, donation.paid, isDonationModalOpen]);

  const toggleFaq = (index: number) => {
    if (faqOpen.includes(index)) {
      setFaqOpen(faqOpen.filter(i => i !== index));
    } else {
      setFaqOpen([...faqOpen, index]);
    }
  };

  const scrollToSection = (id: string, label: string) => {
    setActiveTab(label);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // height of fixed header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] font-sans text-brand-text pb-28 md:pb-24 selection:bg-brand-yellow/30">
      
      <div role="note" className="mt-16 bg-amber-50 text-amber-900 p-3 text-center text-xs">
        {notice}
      </div>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#FAFAF7]/90 backdrop-blur-md border-b border-[#e5e5df] z-50 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Brand Logo and Hamburger Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-primary-navy active:scale-95 flex items-center justify-center cursor-pointer"
              aria-label="Abrir Menu"
              id="menu-btn"
            >
              <Menu className="w-5 h-5 text-primary-navy stroke-[2.2]" />
            </button>
            <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img 
                src="https://ajude.historiasunicasbrasil.com.br/miguel/imagens/logonova.png" 
                alt="Histórias Únicas" 
                className="h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Verification Badge (Desktop Only) */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Plataforma verificada e segura
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-2 text-primary-navy hover:bg-gray-100 rounded-full transition-colors relative"
              title="Compartilhar campanha"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setDonationStep(1);
                setIsDonationModalOpen(true);
              }}
              className="px-4 py-2 bg-brand-yellow hover:bg-yellow-500 text-[#1E3A5F] font-bold rounded-lg text-xs tracking-wider transition-all shadow-sm hover:shadow active:scale-95"
            >
              DOAR AGORA
            </button>
          </div>
        </div>
      </header>

      {/* Floating Share Toast */}
      {shareToast && (
        <div className="fixed top-20 right-4 bg-primary-navy text-white px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm border border-white/10 animate-bounce">
          <CheckCircle className="w-4 h-4 text-brand-green" />
          <span>Link da campanha copiado para a área de transferência!</span>
        </div>
      )}

      {/* Drawer Menu Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px]"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#FAFAF7] z-50 flex flex-col shadow-2xl border-r border-[#e5e5df]/60"
            >
              {/* Header inside drawer */}
              <div className="p-4 flex items-center justify-between border-b border-[#e5e5df]/40">
                <img 
                  src="https://ajude.historiasunicasbrasil.com.br/miguel/imagens/logonova.png" 
                  alt="Histórias Únicas" 
                  className="h-9 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-500 transition-colors active:scale-95 cursor-pointer"
                  aria-label="Fechar Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer navigation list */}
              <div className="flex-1 py-4 px-2 overflow-y-auto space-y-1">
                {[
                  { label: "A História", id: "historia", icon: Pencil },
                  { label: "Fotos", id: "fotos", icon: Camera },
                  { label: "Despesas", id: "seguranca", icon: CreditCard },
                  { label: "Impacto da Doação", id: "impacto", icon: Activity },
                  { label: "Quem Ajudou", id: "apoiadores", icon: User },
                  { label: "Atualizações", id: "atualizacoes", icon: Bell },
                  { label: "Perguntas Frequentes", id: "faq", icon: HelpCircle }
                ].map((item, idx) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.label;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        scrollToSection(item.id, item.label);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                        isActive 
                          ? 'bg-[#E1EDF7] text-primary-navy' 
                          : 'text-gray-600 hover:bg-gray-100/70 hover:text-primary-navy'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary-navy' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Footer inside drawer */}
              <div className="p-4 border-t border-[#e5e5df]/40 bg-white flex items-center gap-2 text-xs text-brand-green font-semibold shrink-0">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E9D65]" />
                <span className="text-[#2E9D65]">Plataforma verificada e segura</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-24 md:pt-28">
        
        {/* Campaign Hero Headline */}
        <section className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary-navy leading-tight font-serif max-w-2xl mx-auto">
            Um pai luta para salvar o filho de 8 anos. <span className="text-[#5B89BA]">Juntos, podemos garantir o remédio e reformar o lar de Luiz Miguel.</span>
          </h1>
        </section>

        {/* Video / Media Player Section */}
        <section className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-xl border border-[#e5e5df] mb-6 group">
          {showVideoOverlay ? (
            /* Mockup Play Overlay */
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-t from-black/80 via-black/50 to-black/70 animate-fade-in">
              <span className="text-brand-yellow text-xs tracking-widest font-extrabold mb-1">DEPOIMENTO EM VÍDEO</span>
              <h3 className="text-white text-lg md:text-2xl font-bold font-serif mb-6 max-w-md leading-snug">
                Você já começou a assistir esse vídeo
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <button
                  onClick={() => handlePlayVideo(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-brand-yellow hover:bg-yellow-500 text-primary-navy font-extrabold rounded-xl transition-all shadow-md transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
                >
                  <Play className="w-4 h-4 fill-primary-navy" />
                  Continuar assistindo?
                </button>
                <button
                  onClick={() => handlePlayVideo(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all border border-white/30 text-sm backdrop-blur-sm"
                >
                  Assistir do início?
                </button>
              </div>
            </div>
          ) : (
            /* Active Custom Video Controls Overlay */
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={toggleMuteVideo}
                className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm"
                title={isVideoMuted ? "Ativar som" : "Desativar som"}
              >
                {isVideoMuted ? <VolumeX className="w-5 h-5 text-brand-danger" /> : <Volume2 className="w-5 h-5 text-brand-green" />}
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            src="https://i.imgur.com/stpKmmr.mp4"
            poster="https://ajude.historiasunicasbrasil.com.br/miguel/imagens/banner1.jpeg"
            className="w-full h-full object-cover"
            loop
            muted={isVideoMuted}
            playsInline
            controls={!showVideoOverlay}
          />
        </section>

        {/* Location & Category Header Stats */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex items-center gap-1 px-3 py-1 bg-[#EAEAE6] text-[#555555] rounded-full text-xs font-semibold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            SAÚDE & FAMÍLIA
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-[#EAEAE6] text-[#555555] rounded-full text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-[#5B89BA]" />
            São Paulo, SP
          </div>
        </div>

        {/* Dynamic Crowdfunding Stats Dashboard */}
        <section className="bg-white rounded-2xl p-5 md:p-6 border border-[#e5e5df] shadow-sm mb-6">
          <div className="grid grid-cols-3 gap-2 md:gap-4 text-center mb-4 border-b border-gray-100/60 pb-4">
            <div>
              <span className="block text-lg md:text-2xl font-extrabold text-primary-navy">
                R$ {raisedAmount.toLocaleString('pt-BR')}
              </span>
              <span className="block text-gray-400 text-xs font-medium">arrecadados</span>
            </div>
            <div className="border-x border-gray-100">
              <span className="block text-lg md:text-2xl font-extrabold text-primary-navy">
                {supporterCount.toLocaleString('pt-BR')}
              </span>
              <span className="block text-gray-400 text-xs font-medium">doações</span>
            </div>
            <div>
              <span className="block text-lg md:text-2xl font-extrabold text-primary-navy">
                R$ {goalAmount.toLocaleString('pt-BR')}
              </span>
              <span className="block text-gray-400 text-xs font-medium">meta</span>
            </div>
          </div>

          {/* Progress Bar with pulse indicator */}
          <div className="mb-4">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2 border border-gray-200/30">
              <div 
                className="h-full bg-primary-navy rounded-full transition-all duration-1000"
                style={{ width: `${percentReached}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#5B89BA]"></span>
              <span>{percentReached}% da meta atingida</span>
            </div>
          </div>

          {/* Large CTA and Share row */}
          <div className="flex flex-col gap-3 mt-5">
            <button
              onClick={() => {
                setDonationStep(1);
                setIsDonationModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-brand-yellow hover:bg-yellow-500 text-primary-navy font-bold rounded-xl transition-all shadow-sm active:scale-98 text-xs md:text-sm tracking-wider uppercase"
            >
              <Heart className="w-4 h-4 fill-primary-navy" />
              QUERO AJUDAR AGORA
            </button>
            <button
              onClick={handleShare}
              className="w-full py-2.5 px-6 bg-[#FAFAF7] hover:bg-gray-100 text-gray-600 font-bold rounded-xl transition-all border border-[#e5e5df] text-xs flex items-center justify-center gap-2 active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
          </div>
        </section>

        {/* Alert Box Section */}
        <div className="bg-[#FFEFEF] border-l-4 border-brand-danger rounded-r-2xl p-4 mb-10 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-brand-danger shrink-0 mt-0.5" />
          <p className="text-xs md:text-sm text-brand-danger font-bold leading-relaxed">
            Urgente: <span className="font-medium text-gray-700">Luiz Miguel precisa de um remédio de R$ 70 mil por mês que a família não tem como pagar.</span>
          </p>
        </div>

        {/* Section: A História */}
        <section id="historia" className="scroll-mt-32 mb-10">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#E1EDF7] text-primary-navy flex items-center justify-center">
              <Pencil className="w-4 h-4 text-primary-navy" />
            </div>
            <h2 className="text-lg md:text-xl font-bold font-serif text-primary-navy">
              A história de Luiz Miguel e Alex
            </h2>
          </div>

          {/* Story banner Image */}
          <div className="rounded-2xl overflow-hidden mb-6 shadow-md border border-[#e5e5df]">
            <img 
              src="https://ajude.historiasunicasbrasil.com.br/miguel/imagens/banner1.jpeg" 
              alt="A infância do Miguel foi trocada por dor, remédios e lágrimas" 
              className="w-full object-cover h-auto"
            />
          </div>

          {/* Story paragraphs */}
          <div className="space-y-4 text-sm md:text-base text-gray-700 leading-relaxed font-sans mb-6">
            <p>
              Em São Paulo, o pequeno <strong className="text-primary-navy font-bold">Luiz Miguel</strong>, de apenas 8 anos, enfrenta uma batalha difícil contra a <strong className="text-primary-navy font-bold">neurofibromatose</strong> — uma doença genética que provoca o surgimento de tumores.
            </p>
            <p>
              Para tentar conter o avanço da doença, ele precisa de um medicamento que custa cerca de <strong className="text-primary-navy font-bold">R$ 70 mil por mês</strong>. O pai dele, <strong className="text-primary-navy font-bold">Alex</strong>, não tem como arcar com esse valor sozinho, e o medicamento ainda não vem sendo fornecido pelo SUS.
            </p>
            <p>
              Luiz Miguel já passou por uma cirurgia que não trouxe o resultado esperado. Uma nova intervenção é arriscada — segundo os médicos, poderia deixá-lo paraplégico. Por causa da doença, ele <strong className="text-primary-navy font-bold">não consegue frequentar a escola</strong> e aguarda novos exames para avaliar como o quadro está evoluindo.
            </p>
            <p>
              A família vive em uma casa na <strong className="text-primary-navy font-bold">zona sul de São Paulo</strong>, em condições difíceis: há infiltrações e falta de móveis adequados para o dia a dia e para o cuidado do menino.
            </p>
            <p>
              Hoje, eles dependem de <strong className="text-primary-navy font-bold">doações e cestas básicas</strong> para seguir em frente.
            </p>
          </div>

          {/* Emotional Highlight Box */}
          <div className="p-4 bg-[#FFF5F5] border-l-4 border-brand-danger rounded-r-2xl mb-6">
            <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
              <strong className="text-brand-danger font-bold">O apelo de Alex:</strong> ele pede ajuda para garantir o medicamento do filho e melhorar as conditions da casa onde vivem. <span className="italic font-medium">&ldquo;Eu tenho esperança que o meu filho vai ficar bem.&rdquo;</span>
            </p>
          </div>

          <p className="font-bold text-primary-navy text-sm md:text-base leading-relaxed mb-10">
            Com a sua ajuda, Luiz Miguel pode ter o tratamento e o lar digno que merece.
          </p>
        </section>

        {/* Section: Fotos / Gallery */}
        <section id="fotos" className="scroll-mt-32 mb-10">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#FFF4EB] text-[#F5B82E] flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#F5B82E]" />
            </div>
            <h2 className="text-lg md:text-xl font-bold font-serif text-primary-navy">
              A realidade de Luiz Miguel
            </h2>
          </div>

          {/* Interactive Carousel */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#e5e5df] bg-neutral-900">
            {/* Active photo */}
            <div className="aspect-video relative cursor-pointer group" onClick={() => setLightboxImage(galleryImages[currentImageIndex])}>
              <img 
                src={galleryImages[currentImageIndex]} 
                alt={`Foto de Luiz Miguel ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-101"
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 text-white text-xs text-center backdrop-blur-xs flex items-center justify-between">
                <span>Clique para ampliar foto {currentImageIndex + 1} de 5</span>
                <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full">{currentImageIndex + 1}/5</span>
              </div>
            </div>

            {/* Thumbnail navigation row */}
            <div className="flex p-2 gap-2 bg-[#FAFAF7] border-t border-[#e5e5df] overflow-x-auto">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 md:w-20 aspect-video rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    currentImageIndex === idx ? 'border-primary-navy scale-95 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Para onde vai sua doação */}
        <section id="impacto" className="scroll-mt-32 mb-10">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#FCF8E3] text-[#D4AC0D] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#D4AC0D]" />
            </div>
            <h2 className="text-lg md:text-xl font-bold font-serif text-[#1E3A5F]">
              Para onde vai sua doação
            </h2>
          </div>

          <div className="space-y-3">
            {/* Card 1 */}
            <div className="bg-[#FFF8F8] border border-[#FFEBEB] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-[#E85D5D] flex items-center justify-center text-white font-bold text-xs shrink-0 select-none">
                <X className="w-4 h-4 stroke-[3]" />
              </div>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                <strong className="font-extrabold text-gray-900">Sem ajuda</strong>, a doença de Luiz Miguel pode seguir avançando sem o medicamento necessário.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FFF8F8] border border-[#FFEBEB] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-[#E85D5D] flex items-center justify-center text-white font-bold text-xs shrink-0 select-none">
                <X className="w-4 h-4 stroke-[3]" />
              </div>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                <strong className="font-extrabold text-gray-900">Sem apoio</strong>, a família continua vivendo em uma casa com infiltrações e sem estrutura adequada.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#F4FBF7] border border-[#E3F6ED] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-[#2E9D65] flex items-center justify-center text-white font-bold text-xs shrink-0 select-none">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                <strong className="font-extrabold text-gray-900">Com você</strong>, Luiz Miguel pode ter acesso ao medicamento durante os próximos meses de tratamento.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#F4FBF7] border border-[#E3F6ED] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-[#2E9D65] flex items-center justify-center text-white font-bold text-xs shrink-0 select-none">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                <strong className="font-extrabold text-gray-900">Com você</strong>, a casa pode ser reformada, oferecendo um ambiente seguro para o tratamento.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-[#F4FBF7] border border-[#E3F6ED] rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-[#2E9D65] flex items-center justify-center text-white font-bold text-xs shrink-0 select-none">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                <strong className="font-extrabold text-gray-900">Com você</strong>, Alex pode focar no cuidado do filho com um pouco mais de tranquilidade.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Quem Ajudou */}
        <section id="apoiadores" className="scroll-mt-32 mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-navy/10 flex items-center justify-center text-primary-navy">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-serif text-primary-navy">
              Quem já ajudou
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#e5e5df] shadow-sm divide-y divide-gray-100 overflow-hidden">
            {supporters.length === 0 && <p className="p-4 text-sm text-gray-500">Ainda não há doações confirmadas para exibir.</p>}
            {supporters.map((sup, idx) => (
              <div 
                key={idx} 
                className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                  sup.isNew ? 'bg-brand-green/5 animate-pulse' : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Animated avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary-navy/5 text-primary-navy flex items-center justify-center font-bold text-sm relative">
                    {sup.name.substring(0, 2).toUpperCase()}
                    {sup.isNew && <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-green border-2 border-white rounded-full"></span>}
                  </div>
                  <div>
                    <h4 className="text-xs md:text-sm font-bold text-primary-navy flex items-center gap-1">
                      {sup.name}
                      {sup.isNew && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-green text-white text-[9px] rounded font-extrabold uppercase tracking-wide">
                          NOVO!
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] md:text-xs text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {sup.time}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs md:text-sm font-extrabold text-primary-navy">
                    {sup.value}
                  </span>
                  <p className="text-[10px] text-gray-400 font-bold">Apoiou a causa</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Atualizações da Campanha */}
        <section id="atualizacoes" className="scroll-mt-32 mb-10">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#E1EDF7] text-primary-navy flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary-navy" />
            </div>
            <h2 className="text-lg md:text-xl font-bold font-serif text-primary-navy">
              Atualizações da campanha
            </h2>
          </div>

          {/* Timeline visualization */}
          <div className="relative border-l border-gray-200 pl-6 ml-4 space-y-8 py-2">
            {/* Update Item 1 */}
            <div className="relative">
              {/* Date node indicator */}
              <span className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-primary-navy text-white text-[10px] font-bold flex items-center justify-center border-4 border-[#FAFAF7]">
                28 MAI
              </span>
              <div>
                <h4 className="text-sm md:text-base font-bold text-primary-navy mb-1 flex items-center gap-2">
                  Campanha ao ar!
                  <span className="px-2 py-0.5 bg-[#2E9D65]/10 text-[#2E9D65] text-[10px] font-bold rounded-full">Lançamento</span>
                </h4>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  A emocionante história de Luiz Miguel e do seu pai guerreiro Alex chegou oficialmente à nossa plataforma Histórias Únicas. Cada compartilhamento de vocês ajuda a alcançar cada vez mais corações bondosos e potenciais doadores.
                </p>
              </div>
            </div>

            {/* Update Item 2 */}
            <div className="relative">
              <span className="absolute -left-10 top-0.5 w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center border-4 border-[#FAFAF7]">
                28 MAI
              </span>
              <div>
                <h4 className="text-sm md:text-base font-bold text-primary-navy mb-1">
                  O desafio crucial do medicamento
                </h4>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  Conforme detalhado no orçamento da campanha, o medicamento essencial custa cerca de R$ 70 mil por mês e não é fornecido pelo SUS nesta urgência. Por isso, pedimos o empenho e ajuda de toda a nossa linda rede.
                </p>
              </div>
            </div>
          </div>
        </section>



        {/* Section: Segurança e Transparência */}
        <section id="seguranca" className="scroll-mt-32 mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-navy/10 flex items-center justify-center text-primary-navy">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-serif text-primary-navy">
              Segurança e Transparência
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#e5e5df] shadow-sm">
            {/* Verification card meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-brand-danger shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-black">Localização</span>
                  <span className="text-xs md:text-sm font-bold text-primary-navy">São Paulo, SP</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-primary-navy shrink-0" />
                <div>
                  <span className="block text-[10px] text-gray-400 uppercase font-black">Campanha Código</span>
                  <span className="text-xs md:text-sm font-bold text-primary-navy">#ID-2026-0602</span>
                </div>
              </div>
            </div>

            <div className="inline-flex w-full items-center justify-center gap-1.5 p-2 bg-brand-green/10 text-brand-green rounded-xl text-xs font-semibold mb-6 border border-brand-green/10">
              <ShieldCheck className="w-4 h-4" />
              Campanha Verificada pela Histórias Únicas
            </div>

            {/* Grid of items from JSON */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-2.5 items-start">
                <div className="p-1.5 rounded bg-brand-green/10 text-brand-green shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-primary-navy">100% Seguro</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Doação criptografada de ponta a ponta e totalmente verificada por auditores.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className="p-1.5 rounded bg-brand-green/10 text-brand-green shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-primary-navy">Prestação de Contas</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Relatórios mensais de despesas e notas fiscais de farmácia publicadas.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className="p-1.5 rounded bg-brand-green/10 text-brand-green shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-primary-navy">Repasse Rápido</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Transferências diárias automáticas em até 24 horas úteis para a farmácia.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className="p-1.5 rounded bg-brand-green/10 text-brand-green shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-primary-navy">Suporte Ativo</h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Equipe humanizada de suporte disponível sete dias por semana para doadores.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section: Perguntas Frequentes (FAQ) */}
        <section id="faq" className="scroll-mt-32 mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-navy/10 flex items-center justify-center text-primary-navy">
              <Info className="w-4 h-4" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold font-serif text-primary-navy">
              Perguntas Frequentes
            </h2>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            
            {/* FAQ 1 */}
            <div className="bg-white rounded-xl border border-[#e5e5df] overflow-hidden transition-all duration-300">
              <button
                onClick={() => toggleFaq(0)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs md:text-sm text-[#1E3A5F] hover:bg-gray-50"
              >
                <span>A doação é 100% segura?</span>
                {faqOpen.includes(0) ? <ChevronUp className="w-4 h-4 shrink-0 text-gray-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />}
              </button>
              {faqOpen.includes(0) && (
                <div className="px-4 pb-4 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 animate-slide-down">
                  Sim, toda a infraestrutura financeira é operada com os mais altos padrões de criptografia bancária. Suas informações de Pix e transações estão blindadas e são monitoradas pela nossa equipe antifraude todos os dias.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="bg-white rounded-xl border border-[#e5e5df] overflow-hidden transition-all duration-300">
              <button
                onClick={() => toggleFaq(1)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs md:text-sm text-[#1E3A5F] hover:bg-gray-50"
              >
                <span>Existe valor mínimo para doar?</span>
                {faqOpen.includes(1) ? <ChevronUp className="w-4 h-4 shrink-0 text-gray-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />}
              </button>
              {faqOpen.includes(1) && (
                <div className="px-4 pb-4 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  O valor mínimo para doação é de R$ 5,00. Qualquer valor a partir de R$ 5,00 já ajuda o Luiz Miguel a atingir a meta mensal do remédio. Cada pequeno esforço conjunto soma no total do tratamento.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="bg-white rounded-xl border border-[#e5e5df] overflow-hidden transition-all duration-300">
              <button
                onClick={() => toggleFaq(2)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs md:text-sm text-[#1E3A5F] hover:bg-gray-50"
              >
                <span>Como saberei que o dinheiro foi usado corretamente?</span>
                {faqOpen.includes(2) ? <ChevronUp className="w-4 h-4 shrink-0 text-gray-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />}
              </button>
              {faqOpen.includes(2) && (
                <div className="px-4 pb-4 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  Prestamos contas em tempo real. Os comprovantes de faturas médicas, compras de remédios de alto custo e recibos de materiais de construção para a reforma do lar são publicados periodicamente aqui no site na seção &ldquo;Atualizações&rdquo;.
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="bg-white rounded-xl border border-[#e5e5df] overflow-hidden transition-all duration-300">
              <button
                onClick={() => toggleFaq(3)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs md:text-sm text-[#1E3A5F] hover:bg-gray-50"
              >
                <span>Posso cancelar minha doação?</span>
                {faqOpen.includes(3) ? <ChevronUp className="w-4 h-4 shrink-0 text-gray-400" /> : <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />}
              </button>
              {faqOpen.includes(3) && (
                <div className="px-4 pb-4 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  Caso queira estornar ou cancelar alguma transferência feita de forma errônea, você pode acionar nosso suporte dedicado por e-mail em até 7 dias úteis para receber reembolso integral e sem complicações.
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Emotion Closing Banner */}
        <div className="rounded-2xl overflow-hidden shadow-md border border-[#e5e5df] mb-12">
          <img 
            src="https://ajude.historiasunicasbrasil.com.br/miguel/imagens/bannerfinal.jpg" 
            alt="Toda pessoa tem uma história" 
            className="w-full h-auto object-cover"
          />
        </div>

      </main>

      {/* Styled Site Footer */}
      <footer className="bg-primary-navy text-white pt-12 pb-24 md:pb-16 border-t border-black/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-white/10">
            <div>
              <span className="text-2xl font-bold tracking-tight text-brand-yellow font-serif block mb-1">
                Histórias Únicas
              </span>
              <span className="text-xs text-white/55 italic">Histórias que transformam vidas</span>
              <p className="text-xs text-white/70 mt-3 leading-relaxed max-w-sm">
                Uma ponte de empatia conectando histórias de vida que merecem finais felizes com pessoas dispostas a fazer a diferença.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-brand-yellow tracking-widest uppercase mb-3">Links Úteis</h4>
              <ul className="space-y-2 text-xs text-white/80">
                <li><a href="#historia" className="hover:text-brand-yellow transition-colors">A História</a></li>
                <li><a href="#fotos" className="hover:text-brand-yellow transition-colors">Fotos Reais</a></li>
                <li><a href="#impacto" className="hover:text-brand-yellow transition-colors">Para onde vai</a></li>
                <li><a href="#apoiadores" className="hover:text-brand-yellow transition-colors">Quem Ajudou</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-brand-yellow tracking-widest uppercase mb-3">Segurança</h4>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-brand-green">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-[11px]">Certificado de Segurança</span>
                </div>
                <p className="text-[10px] text-white/60 leading-relaxed">
                  Doações integradas diretamente com garantias de repasses rastreáveis. Transparência pública total.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-white/60 text-[11px]">
            <div className="flex items-center gap-3">
              <span className="bg-white/10 px-2 py-1 rounded font-mono">CNPJ: 65.955.263/0001-08</span>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#privacidade" className="hover:underline hover:text-white transition-colors">Política de Privacidade</a>
              <a href="#termos" className="hover:underline hover:text-white transition-colors">Termos de Uso</a>
              <a href="#politica-doacao" className="hover:underline hover:text-white transition-colors">Política de Doação</a>
            </div>

            <p className="text-center sm:text-right">
              © 2026 Histórias Únicas. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Persistent Conversion CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FAFAF7] border-t border-[#e5e5df] shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40 py-3.5 px-4 animate-slide-up">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-left shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm md:text-lg font-black text-primary-navy">R$ {raisedAmount.toLocaleString('pt-BR')}</span>
              <span className="text-[10px] text-gray-400">de R$ {goalAmount.toLocaleString('pt-BR')} ({percentReached}%)</span>
            </div>
            <span className="block text-[10px] text-gray-500 font-semibold">{supporterCount.toLocaleString('pt-BR')} doações confirmadas</span>
          </div>

          <button
            onClick={() => {
              setDonationStep(1);
              setIsDonationModalOpen(true);
            }}
            className="flex-1 max-w-sm py-3 px-4 md:px-6 bg-brand-yellow hover:bg-yellow-500 text-primary-navy font-bold rounded-xl text-xs md:text-sm tracking-wider uppercase transition-all shadow-sm active:scale-97 text-center flex items-center justify-center gap-1.5"
          >
            <Heart className="w-4 h-4 fill-primary-navy" />
            DOAR AGORA
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Images */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <img 
            src={lightboxImage} 
            alt="Visualização ampliada" 
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
          
          <p className="text-white/60 text-xs mt-4">Pressione em qualquer lugar para sair da visualização</p>
        </div>
      )}

      {/* Donation Flow Interactive Modal */}
      {isDonationModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-[90] flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100 shrink-0 bg-[#FAFAF7]">
              {donationStep === 1 ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF2FC] flex items-center justify-center">
                    <Heart className="w-5 h-5 text-[#1E3A5F] fill-[#1E3A5F]" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1E3A5F]">Qual valor deseja doar?</h3>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setDonationStep(prev => prev - 1)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1E3A5F] font-bold transition-colors cursor-pointer mr-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                  </button>
                  <h3 className="font-serif font-bold text-base text-[#1E3A5F]">
                    {donationStep === 2 && "Complete seus dados"}
                    {donationStep === 3 && "Chave de Pagamento"}
                    {donationStep === 4 && "Sucesso!"}
                  </h3>
                </div>
              )}

              <button 
                onClick={() => {
                  setIsDonationModalOpen(false);
                  setDonationStep(1);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Scrollable Area */}
            <div className="p-5 overflow-y-auto space-y-4">
              
              {/* STEP 1: VALUE SELECTION */}
              {donationStep === 1 && (
                <div className="space-y-4">
                  {/* Single Tab Display */}
                  <div className="bg-[#4F7EBE] text-white font-extrabold py-3 px-4 text-center rounded-xl text-xs uppercase tracking-wider shadow-sm">
                    Doação Única
                  </div>
                  
                  {/* Preset Values Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: "R$ 20", popular: false },
                      { val: "R$ 30", popular: true },
                      { val: "R$ 50", popular: false },
                      { val: "R$ 100", popular: false },
                      { val: "R$ 150", popular: false },
                      { val: "R$ 200", popular: false },
                      { val: "R$ 250", popular: false },
                      { val: "R$ 500", popular: false },
                      { val: "R$ 1.000", popular: false }
                    ].map((item) => {
                      const isSelected = selectedPreset === item.val && customValue === "";
                      return (
                        <button
                          key={item.val}
                          onClick={() => {
                            setSelectedPreset(item.val);
                            setCustomValue("");
                          }}
                          className={`py-3 px-1 rounded-xl text-sm font-extrabold border-2 transition-all relative cursor-pointer ${
                            isSelected
                              ? 'border-[#4F7EBE] bg-[#EAF2FC] text-[#1E3A5F]'
                              : 'border-gray-100 bg-gray-50 text-[#1E3A5F] hover:bg-gray-100'
                          }`}
                        >
                          {item.val}
                          {item.popular && (
                            <span className="bg-[#FAD02C] text-[#5E4B00] text-[8px] px-1.5 py-0.2 rounded-md font-extrabold absolute -top-1.5 right-2 shadow-xs lowercase">
                              popular
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Value Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="block text-xs font-bold text-gray-500">Ou o que o seu coração mandar ❤️:</span>
                      <span className="text-[11px] font-semibold text-gray-400">Mínimo R$ 5,00</span>
                    </div>
                    <div className={`flex items-center rounded-xl border transition-all bg-white overflow-hidden ${
                      isCustomValueBelowMin 
                        ? 'border-red-400 ring-1 ring-red-400 focus-within:border-red-500 focus-within:ring-red-500' 
                        : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400'
                    }`}>
                      <div className={`px-4 py-3 border-r font-extrabold text-sm shrink-0 select-none ${
                        isCustomValueBelowMin ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#EAF2FC] text-[#1E3A5F] border-gray-200'
                      }`}>
                        R$
                      </div>
                      <input
                        type="number"
                        min="5"
                        step="any"
                        placeholder="Valor livre (mínimo R$ 5,00)"
                        value={customValue}
                        onChange={(e) => {
                          setCustomValue(e.target.value);
                          setSelectedPreset("");
                        }}
                        className="w-full px-4 py-3 text-sm focus:outline-none font-bold text-primary-navy placeholder:text-gray-400 placeholder:font-normal"
                      />
                    </div>
                    {isCustomValueBelowMin && (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                        <span>⚠️ O valor mínimo para doação é de R$ 5,00</span>
                      </p>
                    )}
                  </div>

                  {/* Continuing Button */}
                  <button
                    onClick={() => {
                      if (!isContinueDisabled) {
                        setDonationStep(2);
                      }
                    }}
                    disabled={isContinueDisabled}
                    className="w-full py-3.5 bg-brand-yellow hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-primary-navy font-black rounded-xl text-xs tracking-wider transition-all shadow flex items-center justify-center gap-1 active:scale-98 cursor-pointer disabled:pointer-events-none"
                  >
                    CONTINUAR ➔
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#2E9D65] font-semibold">
                    <ShieldCheck className="w-4 h-4 fill-[#2E9D65]/10" />
                    <span>Pagamento 100% seguro e verificado</span>
                  </div>
                </div>
              )}

              {/* STEP 2: COMPLETE PERSONAL DATA */}
              {donationStep === 2 && (
                <div className="space-y-4">
                  {/* Badge showing selected amount */}
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#EAF2FC] text-[#1E3A5F] font-bold text-xs tracking-wide rounded-full uppercase">
                      <span className="opacity-75">DOANDO</span>
                      <span>
                        R$ {getDonationAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="payer-document" className="block text-xs font-bold text-primary-navy">CPF/CNPJ de quem vai pagar (obrigatório)</label>
                    <input id="payer-document" inputMode="numeric" autoComplete="off" maxLength={18}
                      value={payerTaxNumber} onChange={e => setPayerTaxNumber(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm" />
                    <p className="text-xs text-gray-500">Enviado à DeFlow para processar o Pix. Este documento não aparece publicamente na página.</p>
                  </div>

                  {/* Turbinar Doação Option */}
                  <div className="bg-[#FFFDF0] border border-[#F7EBB2] rounded-2xl p-4 flex gap-3.5 items-start">
                    <input 
                      type="checkbox" 
                      id="turbinar" 
                      checked={turbinarDoacao}
                      onChange={(e) => setTurbinarDoacao(e.target.checked)}
                      className="w-5 h-5 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400 cursor-pointer mt-0.5 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <label htmlFor="turbinar" className="text-xs md:text-sm font-bold text-[#7C5A03] flex items-center gap-1 select-none cursor-pointer">
                        💛 Turbinar minha doação
                      </label>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Adicionar R$ 4,99 à doação. As taxas da DeFlow são descontadas do total recebido em DePix.
                      </p>
                    </div>
                  </div>

                  <div className="text-xs bg-gray-50 rounded-xl p-3 space-y-1" aria-live="polite">
                    {donation.quote ? <>
                      <p>Total a pagar: <strong>{money(donation.quote.amountCents)}</strong></p>
                      <p>Taxas: {money(donation.quote.totalFeeCents)} · Taxa efetiva: {donation.quote.effectiveFeePercent}%</p>
                      <p>Líquido estimado em DePix: {money(donation.quote.netAmountCents)} equivalentes.</p>
                    </> : <p>{donation.quoteError || 'Consultando taxas…'}</p>}
                  </div>
                  {donation.error && <p role="alert" className="text-sm text-red-700">{donation.error}</p>}
                  {/* Generate Pix Trigger */}
                  <button
                    onClick={() => donation.create(payerTaxNumber)}
                    disabled={donation.loading || !donation.quote || !/^(\d{11}|\d{14})$/.test(payerTaxNumber.replace(/\D/g, ""))}
                    className="w-full py-4 bg-brand-yellow hover:bg-yellow-500 text-[#1E3A5F] font-black rounded-xl text-xs tracking-wider uppercase transition-all shadow flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <PixIcon className="w-4 h-4 fill-[#1E3A5F]" />
                    {donation.loading ? "GERANDO PIX…" : "GERAR PIX AGORA"}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#2E9D65] font-semibold pt-1">
                    <ShieldCheck className="w-4 h-4 fill-[#2E9D65]/10" />
                    <span>Pagamento 100% seguro e verificado</span>
                  </div>
                </div>
              )}

              {/* STEP 3: PIX QR CODE & DETAILS */}
              {donationStep === 3 && (
                <div className="space-y-4">
                  {/* Badge showing final amount */}
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#EAF2FC] text-[#1E3A5F] font-bold text-xs tracking-wide rounded-full uppercase">
                      <span className="opacity-75">TOTAL</span>
                      <span>
                        {money(donation.payment?.amountCents || amountCents)}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] text-brand-green font-black tracking-widest uppercase block mb-1">CHAVE COPIA E COLA</span>
                    <h4 className="text-base font-extrabold text-[#1E3A5F] font-serif">Apoie com Pix instantâneo</h4>
                  </div>

                  {donation.payment?.sandbox && <p role="status" className="text-sm text-amber-800">AMBIENTE DE TESTE — esta cobrança não representa uma doação real.</p>}
                  {donation.qrImage && !donation.terminal && <img src={donation.qrImage} alt="QR Code Pix desta doação" className="mx-auto w-56 h-56" />}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <label htmlFor="pix-code" className="text-xs font-bold">Pix copia e cola</label>
                    <textarea id="pix-code" readOnly value={donation.payment?.qrCopyPaste || ''} className="w-full text-xs font-mono p-2" />
                    <button disabled={!donation.payment?.qrCopyPaste || donation.terminal} onClick={() => handleCopyPix(donation.payment!.qrCopyPaste!, setPixCopiado)} className="w-full rounded-lg bg-brand-yellow p-3 font-bold">{pixCopiado ? 'Copiado!' : 'Copiar código Pix'}</button>
                  </div>
                  <div className="text-xs text-gray-600 space-y-2" aria-live="polite">
                    <p>Total desta cobrança: <strong>{money(donation.payment?.amountCents || 0)}</strong></p>
                    {donation.payment?.feeCents !== undefined && <p>Taxas: {money(donation.payment.feeCents)} · Líquido em DePix: {money(donation.payment.netAmountCents || 0)} equivalentes.</p>}
                    {donation.payment?.expiresAt && <p>Vencimento: {new Date(donation.payment.expiresAt).toLocaleString('pt-BR', { timeZone: 'America/Bahia' })} (horário da Bahia).</p>}
                    <p>Confira o recebedor e o valor no aplicativo do seu banco antes de pagar.</p>
                    <p>Status: <strong>{donation.payment?.status}</strong></p>
                    <p>{donation.terminal ? 'A consulta desta cobrança foi encerrada.' : 'Aguardando confirmação da DeFlow. Você pode fechar a página e retornar neste navegador para consultar novamente.'}</p>
                    {donation.error && <p role="alert" className="text-red-700">{donation.error}</p>}
                  </div>
                  {donation.terminal && <button onClick={() => { donation.clear(); setDonationStep(1); }} className="w-full p-3 bg-brand-yellow rounded-xl font-bold">Iniciar outra doação</button>}

                </div>
              )}

              {/* STEP 4: SUCCESS PAGE */}
              {donationStep === 4 && (
                <div className="space-y-4 text-center py-6 animate-fade-in">
                  <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <h3 className="text-xl font-bold font-serif text-[#1E3A5F]">Muito obrigado por sua solidariedade!</h3>
                  
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
                    A DeFlow confirmou o envio de DePix para a carteira da campanha. Obrigado por contribuir!
                  </p>

                  <div className="p-3 bg-[#F4FBF7] border border-[#E3F6ED] rounded-xl text-xs text-[#2E9D65] font-semibold">
                    Seu Pix de {money(donation.payment?.amountCents || amountCents)} ajudará a salvar a infância de Luiz Miguel.
                  </div>

                  <button
                    onClick={() => {
                      setIsDonationModalOpen(false);
                      donation.clear();
                      setDonationStep(1);
                    }}
                    className="w-full py-3.5 bg-primary-navy hover:bg-navy-800 text-white font-black rounded-xl text-xs tracking-wider uppercase transition-all shadow cursor-pointer"
                  >
                    CONCLUIR E VOLTAR AO SITE
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

