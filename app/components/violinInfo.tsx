"use client";

import { useState } from "react";

interface Section {
  id: string;
  label: string;
  icon: string;
}

const SECTIONS: Section[] = [
  { id: "historia",   label: "História",    icon: "📜" },
  { id: "anatomia",   label: "Anatomia",    icon: "🎻" },
  { id: "arte",       label: "Arte & Cultura", icon: "🎨" },
  { id: "mestres",    label: "Mestres",     icon: "👑" },
  { id: "repertorio", label: "Repertório",  icon: "🎼" },
  { id: "curiosidades",label: "Curiosidades",icon: "✨" },
];

const CONTENT: Record<string, { title: string; blocks: { heading?: string; text: string; highlight?: string }[] }> = {
  historia: {
    title: "A história do violino",
    blocks: [
      { heading: "Origens", text: "O violino surgiu na Itália do Norte por volta de 1520–1550, evoluindo de instrumentos medievais como a rebec e a fidula. Andrea Amati de Cremona é considerado o primeiro grande luthier — suas criações estabeleceram a forma que conhecemos hoje." },
      { heading: "A era de ouro de Cremona", text: "Entre 1650 e 1750, Cremona dominou o mundo do violino. A família Stradivari, Guarneri del Gesù e os Amati definiram os padrões de construção que ainda orientam luthiers modernos.", highlight: "Stradivari construiu cerca de 1.100 instrumentos — aproximadamente 650 sobrevivem." },
      { heading: "Barroco ao Romantismo", text: "No período barroco o arco era convexo e mais curto. Com a Revolução Francesa e o virtuosismo do século XIX (Paganini, Viotti), o arco moderno côncavo de Tourte se tornou padrão, permitindo mais volume e sustain." },
      { heading: "O violino no Brasil", text: "O violino chegou ao Brasil com os jesuítas no século XVII. No Nordeste, ganhou identidade própria na música popular — presente em forrós, choro e nas orquestras que nasceram nas cortes de D. João VI no Rio de Janeiro." },
    ],
  },
  anatomia: {
    title: "Anatomia do violino",
    blocks: [
      { heading: "Corpo", text: "Feito de madeira sólida — tampo de abeto (spruce) e fundo/laterais de bordo (maple). A curvatura do tampo não é decorativa: distribui a vibração das cordas por toda a caixa de ressonância." },
      { heading: "A alma e o cavalete", text: "A alma (soundpost) é um pequeno cilindro de abeto dentro do corpo, posicionado abaixo do pé direito do cavalete. Sua posição milimétrica muda drasticamente o timbre — luthiers passam anos aperfeiçoando esse ajuste.", highlight: "Em francês é chamada de 'âme' — alma. O instrumento literalmente tem uma alma." },
      { heading: "Cordas e arco", text: "As quatro cordas (G, D, A, E) eram historicamente de tripa de carneiro. Hoje usam-se aço inoxidável, perlon e ligas sintéticas. O arco usa crina de cavalo — entre 150 e 200 fios — com breu para criar fricção." },
      { heading: "Verniz", text: "O verniz não é apenas cosmético. Afeta a vibração da madeira, protege contra umidade e envelhece junto ao instrumento. A fórmula exata do verniz de Stradivari nunca foi reproduzida com precisão." },
    ],
  },
  arte: {
    title: "Arte, cultura e o violino",
    blocks: [
      { heading: "Na pintura", text: "Caravaggio, Vermeer e Chagall pintaram violinistas como símbolo de emoção humana. Marc Chagall associou o violino à identidade judaica — 'O Violinista Verde' (1923) é um de seus trabalhos mais conhecidos." },
      { heading: "Na literatura", text: "Em Sherlock Holmes, Arthur Conan Doyle faz o detetive tocar violino como forma de raciocinar. Em 'O Perfume' de Süskind, a música de câmara aparece como metáfora de refinamento e decadência." },
      { heading: "No cinema e TV", text: "De 'O Violin' (México, 2005) a 'The Red Violin' (1998), o instrumento frequentemente simboliza trajetórias humanas transmitidas através do tempo. Na série 'Sherlock' da BBC, o violino define o personagem tanto quanto sua inteligência." },
      { heading: "Na música popular", text: "O violino elétrico aparece em bandas de rock progressivo (Kansas, Yellowcard), no country, no folk irlandês e no hip-hop. No Brasil, Sivuca e Dominguinhos usaram o instrumento para definir a identidade do forró pé-de-serra.", highlight: "Lindsey Stirling combinou violino com dubstep e acumulou 4 bilhões de views no YouTube." },
    ],
  },
  mestres: {
    title: "Grandes mestres do violino",
    blocks: [
      { heading: "Niccolò Paganini (1782–1840)", text: "O mais lendário virtuose da história. Suas 24 Capricelas ainda são o teste máximo de técnica violinística. Contemporâneos acreditavam que ele havia vendido a alma ao diabo — tamanha era sua habilidade sobrenatural." },
      { heading: "Joseph Joachim (1831–1907)", text: "Amigo de Brahms e Schumann, Joachim definiu o estilo interpretativo do Romantismo alemão. Brahms escreveu seu Concerto para Violino especificamente para ele." },
      { heading: "Jascha Heifetz (1901–1987)", text: "Considerado por muitos o maior violinista do século XX. Sua técnica era tão perfeita que críticos reclamavam que ele era 'frio' — na verdade, era tão preciso que parecia artificial.", highlight: "Heifetz era tão exigente que raramente sorria em palco. Dizia: 'Se tocar sem erros, não há motivo para sorrir.'" },
      { heading: "Hilary Hahn (1979–)", text: "Americana que estreou na Carnegie Hall aos 16 anos. Combina rigor técnico com musicalidade moderna. Seus registros de Bach são referência para toda uma geração de estudantes." },
    ],
  },
  repertorio: {
    title: "Repertório essencial",
    blocks: [
      { heading: "Para iniciantes", text: "Método Suzuki (volumes 1–4), Sonatas de Corelli, Concerto em Lá Menor de Vivaldi. A base técnica se constrói com escalas em Sevcik e estudos de Wohlfahrt." },
      { heading: "Nível intermediário", text: "Concertos de Vivaldi (As Quatro Estações), Concerto de Mendelsohn em Mi menor, Sonatas de Handel. A leitura à primeira vista começa com os quartetos de Haydn.", highlight: "As Quatro Estações (1723) são as obras orquestrais mais gravadas da história." },
      { heading: "Nível avançado", text: "Concertos de Brahms, Tchaikovsky e Sibelius. Partitas e Sonatas para violino solo de Bach (BWV 1001–1006) são o monte Everest do repertório — tecnicamente e musicalmente." },
      { heading: "Brasil", text: "Sonata para Violino e Piano de Villa-Lobos, Choros de Ernesto Nazareth transcritos, e o repertório de câmara de Camargo Guarnieri são pontos de partida para o violinista que quer explorar a música brasileira de concerto." },
    ],
  },
  curiosidades: {
    title: "Curiosidades",
    blocks: [
      { heading: "O Messiah de Stradivari", text: "Um Stradivarius de 1716, apelidado 'Il Messiah', nunca foi tocado em concerto público. Está no Ashmolean Museum de Oxford — praticamente em estado de fabricação original, tornando-o referência científica para pesquisas sobre verniz e madeira.", highlight: "Stradivarius valem entre $1 e $16 milhões de dólares no mercado atual." },
      { heading: "Por que madeira velha soa melhor?", text: "A lignina da madeira se decompõe com o tempo, tornando-a mais rígida e leve — melhor para vibração. Pesquisadores também descobriram que Stradivari usava madeira tratada com minerais como alumínio, cálcio e cobre, o que pode explicar o timbre único." },
      { heading: "O paradoxo do vibrato", text: "O vibrato — a oscilação de altura tão característica do violino — não existia no período barroco. Foi uma adição do Romantismo. Músicos de performance historicamente informada tocam sem vibrato para soar 'autêntico'." },
      { heading: "Violino vs. Fiddle", text: "Tecnicamente são o mesmo instrumento. A diferença é cultural e de técnica: no fiddle (música folk), o cavalete é ligeiramente achatado para facilitar acordes; a postura e o arco diferem. Como diz o ditado: 'O violino tem um estojo, o fiddle tem uma capa.'" },
      { heading: "No espaço", text: "Em 2013, Don Pettit tocou um violino na Estação Espacial Internacional — em microgravidade. A resina do arco não aderiu corretamente às cordas sem gravidade, produzindo som diferente. A física do violino depende da Terra." },
    ],
  },
};

export default function ViolinInfo() {
  const [active, setActive] = useState<string>("historia");
  const section = CONTENT[active];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(rgba(4,6,10,0.90), rgba(4,6,10,0.95)), url('/violino.jpg')",
      backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed",
      fontFamily: "'Georgia', 'Palatino Linotype', serif",
      color: "#c8c0d8",
    }}>
      {/* Top nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(4,6,10,0.95)", borderBottom: "1px solid #1a1228", backdropFilter: "blur(8px)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", gap: "0", overflowX: "auto", scrollbarWidth: "none" }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)} style={{
                padding: "16px 14px", background: "transparent", border: "none",
                borderBottom: `2px solid ${active === s.id ? "#7a5a9a" : "transparent"}`,
                color: active === s.id ? "#c8a0e8" : "#3a2a4a",
                fontSize: "11px", letterSpacing: "2px", cursor: "pointer",
                fontFamily: "'Georgia', serif", whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Page header */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{ margin: "0 0 8px", fontSize: "10px", letterSpacing: "6px", color: "#5a3a7a", textTransform: "uppercase" }}>
            Enciclopédia
          </p>
          <h1 style={{ margin: 0, fontSize: "clamp(24px,5vw,36px)", fontWeight: 400, color: "#e8e0f0", letterSpacing: "2px", lineHeight: 1.2 }}>
            {section.title}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, #5a3a7a, transparent)" }} />
          </div>
        </div>

        {/* Blocks */}
        {section.blocks.map((block, i) => (
          <div key={i} style={{ marginBottom: "36px" }}>
            {block.heading && (
              <h2 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 400, color: "#7a5a9a", letterSpacing: "4px", textTransform: "uppercase" }}>
                {block.heading}
              </h2>
            )}
            <p style={{ margin: 0, fontSize: "16px", lineHeight: 1.8, color: "#a090b8", fontWeight: 400 }}>
              {block.text}
            </p>
            {block.highlight && (
              <div style={{ marginTop: "16px", padding: "14px 18px", background: "#0e0a18", border: "1px solid #2a1a3a", borderLeft: "3px solid #7a5a9a", borderRadius: "0 8px 8px 0" }}>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.7, color: "#c8a0e8", fontStyle: "italic" }}>
                  {block.highlight}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Bottom nav between sections */}
        <div style={{ marginTop: "56px", paddingTop: "24px", borderTop: "1px solid #1a1228", display: "flex", justifyContent: "space-between" }}>
          {(() => {
            const idx = SECTIONS.findIndex(s => s.id === active);
            const prev = SECTIONS[idx - 1];
            const next = SECTIONS[idx + 1];
            return (
              <>
                {prev ? (
                  <button onClick={() => setActive(prev.id)} style={{ background: "transparent", border: "1px solid #1a1228", borderRadius: "8px", padding: "10px 16px", color: "#5a3a7a", cursor: "pointer", fontFamily: "'Georgia', serif", fontSize: "11px", letterSpacing: "2px" }}>
                    ← {prev.label}
                  </button>
                ) : <span />}
                {next && (
                  <button onClick={() => setActive(next.id)} style={{ background: "transparent", border: "1px solid #1a1228", borderRadius: "8px", padding: "10px 16px", color: "#5a3a7a", cursor: "pointer", fontFamily: "'Georgia', serif", fontSize: "11px", letterSpacing: "2px" }}>
                    {next.label} →
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}