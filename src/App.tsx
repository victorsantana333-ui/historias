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
const DONATION_URL = 'https://deflow.exchange/qr/historias-unicas';

// Custom Pix Logo Icon
const PixIcon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.4 2.1c-.2-.1-.6-.1-.8 0L2.1 11.6c-.1.1-.1.5 0 .7l9.5 9.5c.1.1.5.1.7 0l9.5-9.5c.1-.1.1-.5 0-.7L12.4 2.1zm-.4 3.7l6.1 6.1-6.1 6.1-6.1-6.1 6.1-6.1z" />
    <path d="M12 7.7L7.7 12 12 16.3 16.3 12 12 7.7zm0 2.2l2.1 2.1-2.1 2.1-2.1-2.1 2.1-2.1z" />
  </svg>
);

export default function App() {
  // Campaign state
  const goalAmount = 288000;
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

  // General state
  const [shareToast, setShareToast] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("A História");


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
        Você será direcionado à DeFlow para escolher o valor e concluir sua doação por Pix.
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
            <a href={DONATION_URL} className="px-4 py-2 bg-brand-yellow hover:bg-yellow-500 text-[#1E3A5F] font-bold rounded-lg text-xs tracking-wider transition-all shadow-sm hover:shadow active:scale-95" aria-label="Doar por Pix na DeFlow">
              DOAR AGORA
            </a>
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
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">Meta da campanha</p>
            <p className="text-2xl font-extrabold text-primary-navy">R$ {goalAmount.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-gray-600">Sua contribuição ajuda o Luiz Miguel. Escolha o valor e gere o Pix na página da DeFlow.</p>
          </div>

          {/* Large CTA and Share row */}
          <div className="flex flex-col gap-3 mt-5">
            <a href={DONATION_URL} className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-brand-yellow hover:bg-yellow-500 text-primary-navy font-bold rounded-xl transition-all shadow-sm active:scale-98 text-xs md:text-sm tracking-wider uppercase" aria-label="Doar por Pix na DeFlow">
              <Heart className="w-4 h-4 fill-primary-navy" />
              QUERO AJUDAR AGORA
            </a>
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

          <div className="bg-white rounded-2xl border border-[#e5e5df] p-5 text-sm text-gray-600">
            Obrigado a cada pessoa que contribui e compartilha esta campanha. As doações são processadas na DeFlow; a lista e o total de pagamentos não são exibidos nesta página.
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
                  Os valores disponíveis e os limites para doar são informados na página de pagamento da DeFlow. Cada contribuição ajuda o Luiz Miguel.
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
            <span className="block text-sm font-black text-primary-navy">Ajude o Luiz Miguel</span>
            <span className="block text-[10px] text-gray-500">Pagamento por Pix na DeFlow</span>
          </div>

          <a href={DONATION_URL} className="flex-1 max-w-sm py-3 px-4 md:px-6 bg-brand-yellow hover:bg-yellow-500 text-primary-navy font-bold rounded-xl text-xs md:text-sm tracking-wider uppercase transition-all shadow-sm active:scale-97 text-center flex items-center justify-center gap-1.5" aria-label="Doar por Pix na DeFlow">
            <Heart className="w-4 h-4 fill-primary-navy" />
            DOAR AGORA
          </a>
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

    </div>
  );
}
