/* TechRib V30 — fallbacks visuais Premium extraídos do app-v51.js.
   Mantém os mesmos SVGs e somente instala fallback quando o servidor não fornece visual.svg. */
(function(root){
  'use strict';
  const VERSION=30;
  const pumpSystemVisualFallback="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 760\" role=\"img\" aria-label=\"Sistema Premium de bombeamento entre reservatórios\" data-techrib-preserve-text-style=\"true\">\n  <defs>\n    <linearGradient id=\"ps-bg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#10232d\"/><stop offset=\"1\" stop-color=\"#07131a\"/></linearGradient>\n    <linearGradient id=\"ps-metal\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#e9eef1\"/><stop offset=\".45\" stop-color=\"#8fa2ad\"/><stop offset=\"1\" stop-color=\"#42545f\"/></linearGradient>\n    <linearGradient id=\"ps-water\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#55d6ff\"/><stop offset=\".45\" stop-color=\"#159bd3\"/><stop offset=\"1\" stop-color=\"#07699a\"/></linearGradient>\n    <radialGradient id=\"ps-pump\" cx=\"35%\" cy=\"30%\"><stop stop-color=\"#5f7c8a\"/><stop offset=\".55\" stop-color=\"#263d48\"/><stop offset=\"1\" stop-color=\"#0b1820\"/></radialGradient>\n    <filter id=\"ps-shadow\"><feDropShadow dx=\"0\" dy=\"5\" stdDeviation=\"6\" flood-opacity=\".38\"/></filter>\n    <filter id=\"ps-glow\"><feGaussianBlur stdDeviation=\"4\" result=\"b\"/><feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter>\n    <clipPath id=\"upper-tank-clip\"><rect x=\"565\" y=\"130\" width=\"280\" height=\"236\" rx=\"12\"/></clipPath>\n    <clipPath id=\"lower-tank-clip\"><rect x=\"105\" y=\"490\" width=\"340\" height=\"158\" rx=\"10\"/></clipPath>\n    <g id=\"ps-terminal-port\"><circle r=\"11\" fill=\"#101a20\" stroke=\"#f1c75b\" stroke-width=\"3\"/><circle r=\"5\" fill=\"#dfe8ed\"/><path d=\"M-4 0h8M0-4v8\" stroke=\"#536873\" stroke-width=\"2\"/></g>\n    <style>\n      .ps-title{font:900 25px Arial,sans-serif;fill:#fff;letter-spacing:.6px}.ps-sub{font:700 12px Arial,sans-serif;fill:#9fc3d4}.ps-label{font:800 13px Arial,sans-serif;fill:#eaf7fb}.ps-small{font:700 10px Arial,sans-serif;fill:#a9c2ce}.ps-value{font:900 20px Arial,sans-serif;fill:#7dd3fc}.ps-terminal-label{font:900 11px Arial,sans-serif;fill:#f5e7ad}.ps-btn text{pointer-events:none}.ps-btn rect{fill:#173747;stroke:#6a8591;stroke-width:1.5}.ps-btn:hover rect{fill:#245369}.ps-btn{cursor:pointer}.ps-float-label{font:900 10px Arial,sans-serif;fill:#f3f7f9}.wire-anchor-hitbox{fill:transparent;stroke:transparent;stroke-width:1}\n    </style>\n  </defs>\n\n  <rect x=\"14\" y=\"14\" width=\"972\" height=\"732\" rx=\"28\" fill=\"url(#ps-bg)\" stroke=\"#b78b25\" stroke-width=\"4\" filter=\"url(#ps-shadow)\"/>\n  <rect x=\"30\" y=\"30\" width=\"940\" height=\"56\" rx=\"14\" fill=\"#0d2c3a\" stroke=\"#365865\"/>\n  <text x=\"52\" y=\"64\" class=\"ps-title\">TECHRIB • SISTEMA DE BOMBEAMENTO</text>\n  <text x=\"944\" y=\"55\" text-anchor=\"end\" class=\"ps-sub\">RESERVATÓRIO INFERIOR → BOMBA → CAIXA SUPERIOR</text>\n  <text x=\"944\" y=\"73\" text-anchor=\"end\" class=\"ps-small\">AUTOMÁTICO POR BOIA MÍNIMA / MÁXIMA</text>\n\n  <!-- Caixa superior -->\n  <g id=\"upper-tank\" filter=\"url(#ps-shadow)\">\n    <path d=\"M545 112h320l18 18v260l-18 18H545l-18-18V130z\" fill=\"#162c37\" stroke=\"#d3dde2\" stroke-width=\"4\"/>\n    <rect x=\"558\" y=\"123\" width=\"294\" height=\"254\" rx=\"16\" fill=\"#071b25\" stroke=\"#5c7480\" stroke-width=\"2\"/>\n    <g clip-path=\"url(#upper-tank-clip)\">\n      <rect id=\"upper-water\" data-pump-upper-water=\"true\" x=\"565\" y=\"304\" width=\"280\" height=\"62\" fill=\"url(#ps-water)\" opacity=\".93\"/>\n      <path id=\"upper-wave\" data-pump-upper-wave=\"true\" d=\"M560 305 Q595 296 630 305T700 305T770 305T850 305\" fill=\"none\" stroke=\"#c6f3ff\" stroke-width=\"5\" opacity=\".8\"/>\n      <g opacity=\".55\" fill=\"#d8f7ff\"><circle cx=\"620\" cy=\"332\" r=\"5\"/><circle cx=\"700\" cy=\"344\" r=\"4\"/><circle cx=\"785\" cy=\"325\" r=\"6\"/></g>\n    </g>\n    <text x=\"705\" y=\"105\" text-anchor=\"middle\" class=\"ps-label\">CAIXA D'ÁGUA SUPERIOR</text>\n    <text x=\"705\" y=\"220\" text-anchor=\"middle\" data-pump-upper-value=\"true\" class=\"ps-value\">28%</text>\n    <rect x=\"873\" y=\"145\" width=\"72\" height=\"88\" rx=\"9\" fill=\"#07151c\" stroke=\"#476571\"/>\n    <text x=\"909\" y=\"166\" text-anchor=\"middle\" class=\"ps-small\">NÍVEL</text>\n    <text x=\"909\" y=\"199\" text-anchor=\"middle\" data-pump-upper-mini=\"true\" class=\"ps-value\">28%</text>\n    <circle cx=\"909\" cy=\"216\" r=\"6\" data-pump-upper-led=\"true\" fill=\"#f59e0b\"/>\n  </g>\n\n  <!-- Boias -->\n  <g id=\"float-max\" data-pump-float-max=\"true\">\n    <line x1=\"815\" y1=\"167\" x2=\"776\" y2=\"184\" stroke=\"#f5d44c\" stroke-width=\"4\"/>\n    <circle cx=\"768\" cy=\"188\" r=\"14\" fill=\"#ef4444\" stroke=\"#fff\" stroke-width=\"2\"/>\n    <rect x=\"640\" y=\"157\" width=\"113\" height=\"27\" rx=\"8\" fill=\"#7f1d1d\" stroke=\"#ef7777\"/>\n    <text x=\"696\" y=\"175\" text-anchor=\"middle\" class=\"ps-float-label\">BOIA MÁXIMA</text>\n  </g>\n  <g id=\"float-min\" data-pump-float-min=\"true\">\n    <line x1=\"815\" y1=\"310\" x2=\"776\" y2=\"326\" stroke=\"#f5d44c\" stroke-width=\"4\"/>\n    <circle cx=\"768\" cy=\"331\" r=\"14\" fill=\"#22c55e\" stroke=\"#fff\" stroke-width=\"2\"/>\n    <rect x=\"640\" y=\"298\" width=\"113\" height=\"27\" rx=\"8\" fill=\"#14532d\" stroke=\"#5ee88d\"/>\n    <text x=\"696\" y=\"316\" text-anchor=\"middle\" class=\"ps-float-label\">BOIA MÍNIMA</text>\n  </g>\n\n  <!-- Reservatório inferior -->\n  <g id=\"lower-tank\" filter=\"url(#ps-shadow)\">\n    <path d=\"M78 462h394v202l-20 20H98l-20-20z\" fill=\"#172c37\" stroke=\"#d3dde2\" stroke-width=\"4\"/>\n    <rect x=\"98\" y=\"482\" width=\"354\" height=\"174\" rx=\"12\" fill=\"#071b25\" stroke=\"#5c7480\" stroke-width=\"2\"/>\n    <g clip-path=\"url(#lower-tank-clip)\">\n      <rect id=\"lower-water\" data-pump-lower-water=\"true\" x=\"105\" y=\"509\" width=\"340\" height=\"139\" fill=\"url(#ps-water)\" opacity=\".9\"/>\n      <path id=\"lower-wave\" data-pump-lower-wave=\"true\" d=\"M100 510 Q145 501 190 510T280 510T370 510T455 510\" fill=\"none\" stroke=\"#c6f3ff\" stroke-width=\"5\" opacity=\".8\"/>\n    </g>\n    <text x=\"275\" y=\"451\" text-anchor=\"middle\" class=\"ps-label\">RESERVATÓRIO INFERIOR / CISTERNA</text>\n    <text x=\"275\" y=\"560\" text-anchor=\"middle\" data-pump-lower-value=\"true\" class=\"ps-value\">88%</text>\n    <text x=\"275\" y=\"585\" text-anchor=\"middle\" class=\"ps-small\">proteção contra trabalho a seco</text>\n    <path d=\"M80 535h-38v-54\" fill=\"none\" stroke=\"#48bce9\" stroke-width=\"15\" stroke-linecap=\"round\"/>\n    <path d=\"M42 481v-30\" stroke=\"#48bce9\" stroke-width=\"5\"/>\n    <text x=\"42\" y=\"438\" text-anchor=\"middle\" class=\"ps-small\">ENTRADA</text>\n  </g>\n\n  <!-- Tubulação + bomba -->\n  <path d=\"M444 584H493V215H552\" fill=\"none\" stroke=\"#6f858f\" stroke-width=\"34\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n  <path d=\"M444 584H493V215H552\" fill=\"none\" stroke=\"#b9c9d0\" stroke-width=\"20\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n  <path id=\"pump-flow-path\" data-pump-flow=\"true\" d=\"M444 584H493V215H552\" fill=\"none\" stroke=\"#31c8ff\" stroke-width=\"10\" stroke-linejoin=\"round\" stroke-linecap=\"round\" stroke-dasharray=\"24 18\" stroke-dashoffset=\"0\" opacity=\"0\" filter=\"url(#ps-glow)\"/>\n  <path d=\"M852 320h48v110h55\" fill=\"none\" stroke=\"#6f858f\" stroke-width=\"26\" stroke-linejoin=\"round\"/>\n  <path d=\"M852 320h48v110h55\" fill=\"none\" stroke=\"#b9c9d0\" stroke-width=\"14\" stroke-linejoin=\"round\"/>\n  <text x=\"924\" y=\"454\" text-anchor=\"middle\" class=\"ps-small\">CONSUMO</text>\n\n  <g id=\"pump\" transform=\"translate(423 505)\" filter=\"url(#ps-shadow)\">\n    <rect x=\"0\" y=\"50\" width=\"92\" height=\"72\" rx=\"12\" fill=\"url(#ps-metal)\" stroke=\"#d8e1e5\" stroke-width=\"3\"/>\n    <circle cx=\"45\" cy=\"50\" r=\"45\" fill=\"url(#ps-pump)\" stroke=\"#b9c9d0\" stroke-width=\"4\"/>\n    <circle cx=\"45\" cy=\"50\" r=\"27\" fill=\"#0e2028\" stroke=\"#77a0b2\" stroke-width=\"3\"/>\n    <g id=\"pump-impeller\" data-pump-impeller=\"true\">\n      <path d=\"M45 27c8 6 13 13 14 21-6-4-13-5-20-2 2-8 4-14 6-19z\" fill=\"#55d6ff\"/>\n      <path d=\"M66 57c-6 8-13 13-21 14 4-6 5-13 2-20 8 2 14 4 19 6z\" fill=\"#55d6ff\"/>\n      <path d=\"M37 72c-8-6-13-13-14-21 6 4 13 5 20 2-2 8-4 14-6 19z\" fill=\"#55d6ff\"/>\n      <path d=\"M22 43c6-8 13-13 21-14-4 6-5 13-2 20-8-2-14-4-19-6z\" fill=\"#55d6ff\"/>\n    </g>\n    <circle cx=\"45\" cy=\"50\" r=\"7\" fill=\"#e8f1f4\"/>\n    <rect x=\"18\" y=\"118\" width=\"54\" height=\"12\" rx=\"4\" fill=\"#101820\"/>\n    <text x=\"46\" y=\"148\" text-anchor=\"middle\" class=\"ps-label\">BOMBA</text>\n  </g>\n\n  <!-- Painel de estado -->\n  <g transform=\"translate(535 433)\">\n    <rect width=\"416\" height=\"201\" rx=\"16\" fill=\"#0a1d27\" stroke=\"#42616d\" stroke-width=\"2\"/>\n    <text x=\"22\" y=\"29\" class=\"ps-label\">CONTROLE LOCAL DIDÁTICO</text>\n    <text x=\"22\" y=\"54\" class=\"ps-small\">Modo</text><text x=\"93\" y=\"54\" data-pump-mode=\"true\" class=\"ps-label\" fill=\"#f4d675\">AUTO</text>\n    <text x=\"215\" y=\"54\" class=\"ps-small\">Bomba</text><text x=\"287\" y=\"54\" data-pump-state=\"true\" class=\"ps-label\">PARADA</text>\n    <text x=\"22\" y=\"78\" class=\"ps-small\">Status</text><text x=\"93\" y=\"78\" data-pump-status=\"true\" class=\"ps-label\">AGUARDANDO NÍVEL MÍNIMO</text>\n    <g class=\"ps-btn\" data-pump-action=\"auto\" transform=\"translate(20 102)\"><rect width=\"82\" height=\"40\" rx=\"8\"/><text x=\"41\" y=\"25\" text-anchor=\"middle\" class=\"ps-label\">AUTO</text></g>\n    <g class=\"ps-btn\" data-pump-action=\"manual\" transform=\"translate(112 102)\"><rect width=\"82\" height=\"40\" rx=\"8\"/><text x=\"41\" y=\"25\" text-anchor=\"middle\" class=\"ps-label\">BOMBA</text></g>\n    <g class=\"ps-btn\" data-pump-action=\"consume\" transform=\"translate(204 102)\"><rect width=\"88\" height=\"40\" rx=\"8\"/><text x=\"44\" y=\"25\" text-anchor=\"middle\" class=\"ps-label\">CONSUMO</text></g>\n    <g class=\"ps-btn\" data-pump-action=\"reset\" transform=\"translate(302 102)\"><rect width=\"92\" height=\"40\" rx=\"8\"/><text x=\"46\" y=\"25\" text-anchor=\"middle\" class=\"ps-label\">RESET</text></g>\n    <circle cx=\"35\" cy=\"169\" r=\"8\" data-pump-led-min=\"true\" fill=\"#334155\"/><text x=\"50\" y=\"173\" class=\"ps-small\">MIN</text>\n    <circle cx=\"112\" cy=\"169\" r=\"8\" data-pump-led-max=\"true\" fill=\"#334155\"/><text x=\"127\" y=\"173\" class=\"ps-small\">MAX</text>\n    <circle cx=\"197\" cy=\"169\" r=\"8\" data-pump-led-dry=\"true\" fill=\"#22c55e\"/><text x=\"212\" y=\"173\" class=\"ps-small\">CISTERNA OK</text>\n    <circle cx=\"332\" cy=\"169\" r=\"8\" data-pump-led-run=\"true\" fill=\"#334155\"/><text x=\"347\" y=\"173\" class=\"ps-small\">RUN</text>\n  </g>\n\n  <!-- Bornes de potência -->\n  <g id=\"terminals\">\n    <text x=\"78\" y=\"718\" class=\"ps-small\" fill=\"#f4d675\">POTÊNCIA DA BOMBA</text>\n    <g data-terminal=\"U\" data-wire-side=\"bottom\" transform=\"translate(195 716)\" data-terminal-id=\"pump-system-U\" data-terminal-name=\"U — bomba\" data-domain=\"power\" data-function=\"motor-power-input\" data-voltage-class=\"configurable-ac\" data-direction=\"input\" data-electrical-type=\"power-input\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"U\" data-wire-side=\"bottom\" r=\"14\"/><text x=\"0\" y=\"-19\" text-anchor=\"middle\" class=\"ps-terminal-label\">U</text></g>\n    <g data-terminal=\"V\" data-wire-side=\"bottom\" transform=\"translate(240 716)\" data-terminal-id=\"pump-system-V\" data-terminal-name=\"V — bomba\" data-domain=\"power\" data-function=\"motor-power-input\" data-voltage-class=\"configurable-ac\" data-direction=\"input\" data-electrical-type=\"power-input\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"V\" data-wire-side=\"bottom\" r=\"14\"/><text x=\"0\" y=\"-19\" text-anchor=\"middle\" class=\"ps-terminal-label\">V</text></g>\n    <g data-terminal=\"W\" data-wire-side=\"bottom\" transform=\"translate(285 716)\" data-terminal-id=\"pump-system-W\" data-terminal-name=\"W — bomba\" data-domain=\"power\" data-function=\"motor-power-input\" data-voltage-class=\"configurable-ac\" data-direction=\"input\" data-electrical-type=\"power-input\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"W\" data-wire-side=\"bottom\" r=\"14\"/><text x=\"0\" y=\"-19\" text-anchor=\"middle\" class=\"ps-terminal-label\">W</text></g>\n    <g data-terminal=\"PE\" data-wire-side=\"bottom\" transform=\"translate(330 716)\" data-terminal-id=\"pump-system-PE\" data-terminal-name=\"PE — proteção\" data-domain=\"protective-earth\" data-function=\"protective-earth\" data-voltage-class=\"earth\" data-direction=\"passive\" data-electrical-type=\"protective-earth\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"PE\" data-wire-side=\"bottom\" r=\"14\"/><text x=\"0\" y=\"-19\" text-anchor=\"middle\" class=\"ps-terminal-label\">PE</text></g>\n\n    <text x=\"535\" y=\"676\" class=\"ps-small\" fill=\"#f4d675\">BOIAS / CONTATOS SECOS</text>\n    <g data-terminal=\"COM_MIN\" data-wire-side=\"bottom\" transform=\"translate(560 716)\" data-terminal-id=\"pump-system-COM-MIN\" data-terminal-name=\"COM_MIN\" data-domain=\"control\" data-function=\"dry-contact\" data-voltage-class=\"dry-contact\" data-direction=\"passive\" data-electrical-type=\"dry-contact\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"COM_MIN\" data-wire-side=\"bottom\" r=\"14\"/><text x=\"0\" y=\"-19\" text-anchor=\"middle\" class=\"ps-terminal-label\">C.MIN</text></g>\n    <g data-terminal=\"MIN_NO\" data-wire-side=\"bottom\" transform=\"translate(625 716)\" data-terminal-id=\"pump-system-MIN-NO\" data-terminal-name=\"MIN_NO\" data-domain=\"control\" data-function=\"dry-contact\" data-voltage-class=\"dry-contact\" data-direction=\"output\" data-electrical-type=\"dry-contact-no\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"MIN_NO\" data-wire-side=\"bottom\" r=\"14\"/><text x=\"0\" y=\"-19\" text-anchor=\"middle\" class=\"ps-terminal-label\">MIN NA</text></g>\n    <g data-terminal=\"COM_MAX\" data-wire-side=\"bottom\" transform=\"translate(690 716)\" data-terminal-id=\"pump-system-COM-MAX\" data-terminal-name=\"COM_MAX\" data-domain=\"control\" data-function=\"dry-contact\" data-voltage-class=\"dry-contact\" data-direction=\"passive\" data-electrical-type=\"dry-contact\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"COM_MAX\" data-wire-side=\"bottom\" r=\"14\"/><text x=\"0\" y=\"-19\" text-anchor=\"middle\" class=\"ps-terminal-label\">C.MAX</text></g>\n    <g data-terminal=\"MAX_NC\" data-wire-side=\"bottom\" transform=\"translate(755 716)\" data-terminal-id=\"pump-system-MAX-NC\" data-terminal-name=\"MAX_NC\" data-domain=\"control\" data-function=\"dry-contact\" data-voltage-class=\"dry-contact\" data-direction=\"output\" data-electrical-type=\"dry-contact-nc\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"MAX_NC\" data-wire-side=\"bottom\" r=\"14\"/><text x=\"0\" y=\"-19\" text-anchor=\"middle\" class=\"ps-terminal-label\">MAX NF</text></g>\n    <g data-terminal=\"MAX_NO\" data-wire-side=\"bottom\" transform=\"translate(820 716)\" data-terminal-id=\"pump-system-MAX-NO\" data-terminal-name=\"MAX_NO\" data-domain=\"control\" data-function=\"dry-contact\" data-voltage-class=\"dry-contact\" data-direction=\"output\" data-electrical-type=\"dry-contact-no\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"MAX_NO\" data-wire-side=\"bottom\" r=\"14\"/><text x=\"0\" y=\"-19\" text-anchor=\"middle\" class=\"ps-terminal-label\">MAX NA</text></g>\n    <g data-terminal=\"COM_DRY\" data-wire-side=\"right\" transform=\"translate(964 586)\" data-terminal-id=\"pump-system-COM-DRY\" data-terminal-name=\"COM_DRY\" data-domain=\"control\" data-function=\"dry-contact\" data-voltage-class=\"dry-contact\" data-direction=\"passive\" data-electrical-type=\"dry-contact\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"COM_DRY\" data-wire-side=\"right\" r=\"14\"/><text x=\"-21\" y=\"4\" text-anchor=\"end\" class=\"ps-terminal-label\">C.CIST</text></g>\n    <g data-terminal=\"LOWER_OK\" data-wire-side=\"right\" transform=\"translate(964 626)\" data-terminal-id=\"pump-system-LOWER-OK\" data-terminal-name=\"LOWER_OK\" data-domain=\"control\" data-function=\"dry-contact\" data-voltage-class=\"dry-contact\" data-direction=\"output\" data-electrical-type=\"dry-contact-no\"><use href=\"#ps-terminal-port\"/><circle class=\"wire-anchor-hitbox\" data-wire-anchor=\"LOWER_OK\" data-wire-side=\"right\" r=\"14\"/><text x=\"-21\" y=\"4\" text-anchor=\"end\" class=\"ps-terminal-label\">CIST OK</text></g>\n  </g>\n</svg>\n";

  const gateSystemVisualFallback=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 760" role="img" aria-label="Sistema Premium de portões e portas automáticas" data-techrib-preserve-text-style="true">
  <defs>
    <linearGradient id="gs-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10232d"/><stop offset="1" stop-color="#07131a"/></linearGradient>
    <linearGradient id="gs-panel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1a3240"/><stop offset="1" stop-color="#0f1f28"/></linearGradient>
    <linearGradient id="gs-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf2f5"/><stop offset=".5" stop-color="#a8bac4"/><stop offset="1" stop-color="#50626d"/></linearGradient>
    <linearGradient id="gs-gate" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#d9e6eb"/><stop offset="1" stop-color="#7e949f"/></linearGradient>
    <linearGradient id="gs-door" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f0f4f6"/><stop offset="1" stop-color="#90a7b2"/></linearGradient>
    <filter id="gs-shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-opacity=".35"/></filter>
    <filter id="gs-glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <g id="gs-terminal-port"><circle r="11" fill="#101a20" stroke="#f1c75b" stroke-width="3"/><circle r="5" fill="#dfe8ed"/><path d="M-4 0h8M0-4v8" stroke="#536873" stroke-width="2"/></g>
    <style>
      .gs-title{font:900 25px Arial,sans-serif;fill:#fff;letter-spacing:.5px}
      .gs-sub{font:700 12px Arial,sans-serif;fill:#9fc3d4}
      .gs-label{font:800 13px Arial,sans-serif;fill:#eaf7fb}
      .gs-small{font:700 10px Arial,sans-serif;fill:#a9c2ce}
      .gs-value{font:900 20px Arial,sans-serif;fill:#7dd3fc}
      .gs-terminal-label{font:900 11px Arial,sans-serif;fill:#f5e7ad}
      .gs-btn text{pointer-events:none}.gs-btn rect{fill:#173747;stroke:#6a8591;stroke-width:1.5}.gs-btn:hover rect{fill:#245369}.gs-btn{cursor:pointer}
      .wire-anchor-hitbox{fill:transparent;stroke:transparent;stroke-width:1}
    </style>
  </defs>

  <rect x="14" y="14" width="1072" height="732" rx="28" fill="url(#gs-bg)" stroke="#b78b25" stroke-width="4" filter="url(#gs-shadow)"/>
  <rect x="30" y="30" width="1040" height="56" rx="14" fill="#0d2c3a" stroke="#365865"/>
  <text x="52" y="64" class="gs-title">TECHRIB • SISTEMA DE PORTÕES AUTOMÁTICOS</text>
  <text x="1044" y="55" text-anchor="end" class="gs-sub">PORTÃO DESLIZANTE + PORTA DE GARAGEM</text>
  <text x="1044" y="73" text-anchor="end" class="gs-small">FOTOCÉLULA • FINS DE CURSO • COMANDO ABRIR / FECHAR</text>

  <g filter="url(#gs-shadow)">
    <rect x="54" y="118" width="466" height="356" rx="20" fill="#0b1b24" stroke="#4f6974" stroke-width="2"/>
    <text x="72" y="145" class="gs-label">PORTÃO DESLIZANTE</text>
    <text x="72" y="166" class="gs-small">motor deslizante com cremalheira e fotocélula</text>

    <rect x="102" y="200" width="360" height="164" rx="12" fill="#162d39" stroke="#5a7683"/>
    <rect x="126" y="226" width="210" height="126" rx="8" fill="url(#gs-gate)" stroke="#d7e2e7" stroke-width="3" data-gate-leaf="true"/>
    <g stroke="#5d7480" stroke-width="6" opacity=".9" data-gate-bars="true">
      <path d="M148 238v100M180 238v100M212 238v100M244 238v100M276 238v100M308 238v100"/>
    </g>
    <rect x="104" y="370" width="360" height="16" rx="8" fill="#7d8f98"/>
    <rect x="356" y="332" width="44" height="42" rx="8" fill="#1b2931" stroke="#a0b5bf"/>
    <circle cx="378" cy="353" r="12" fill="#0b1820" stroke="#5fd0ff"/>
    <circle cx="378" cy="353" r="4" fill="#7dd3fc"/>
    <rect x="110" y="196" width="10" height="194" fill="#ced9de"/>
    <rect x="448" y="196" width="10" height="194" fill="#ced9de"/>

    <circle cx="138" cy="310" r="10" fill="#22c55e" data-gate-photo-left="true"/>
    <circle cx="432" cy="310" r="10" fill="#22c55e" data-gate-photo-right="true"/>
    <line x1="148" y1="310" x2="422" y2="310" stroke="#67e8f9" stroke-width="5" stroke-dasharray="12 10" data-gate-beam="true" filter="url(#gs-glow)"/>
    <text x="285" y="403" text-anchor="middle" class="gs-small">Abertura do portão</text>
    <text x="285" y="432" text-anchor="middle" data-gate-position="true" class="gs-value">0%</text>
  </g>

  <g filter="url(#gs-shadow)">
    <rect x="566" y="118" width="480" height="356" rx="20" fill="#0b1b24" stroke="#4f6974" stroke-width="2"/>
    <text x="584" y="145" class="gs-label">PORTA DE GARAGEM AUTOMÁTICA</text>
    <text x="584" y="166" class="gs-small">porta seccional sincronizada com o mesmo acionamento didático</text>
    <rect x="652" y="188" width="272" height="226" rx="14" fill="#162d39" stroke="#5a7683"/>
    <rect x="674" y="206" width="228" height="188" rx="6" fill="url(#gs-door)" stroke="#d7e2e7" stroke-width="3" data-garage-door="true"/>
    <g stroke="#6a8190" stroke-width="3" opacity=".95" data-garage-door-lines="true">
      <path d="M676 238h224M676 270h224M676 302h224M676 334h224M676 366h224"/>
    </g>
    <path d="M658 190v-18h258v18" fill="none" stroke="#94a8b2" stroke-width="6" stroke-linecap="round"/>
    <circle cx="926" cy="198" r="9" fill="#f59e0b" data-gate-lamp="true"/>
    <text x="789" y="432" text-anchor="middle" class="gs-small">Abertura da porta</text>
    <text x="789" y="456" text-anchor="middle" data-garage-position="true" class="gs-value">0%</text>
  </g>

  <g transform="translate(54 500)">
    <rect width="992" height="176" rx="18" fill="#0a1d27" stroke="#42616d" stroke-width="2"/>
    <text x="22" y="28" class="gs-label">CONTROLE LOCAL DIDÁTICO</text>
    <text x="22" y="54" class="gs-small">Modo</text><text x="84" y="54" data-gate-mode="true" class="gs-label" fill="#f4d675">AUTO</text>
    <text x="200" y="54" class="gs-small">Estado</text><text x="264" y="54" data-gate-status="true" class="gs-label">FECHADO</text>
    <text x="22" y="78" class="gs-small">FCA</text><text x="53" y="78" data-gate-fca="true" class="gs-label">ON</text>
    <text x="110" y="78" class="gs-small">FCC</text><text x="145" y="78" data-gate-fcc="true" class="gs-label">OFF</text>
    <text x="220" y="78" class="gs-small">Fotocélula</text><text x="300" y="78" data-gate-photo="true" class="gs-label">LIVRE</text>
    <text x="418" y="78" class="gs-small">Auto-fechamento</text><text x="532" y="78" data-gate-auto="true" class="gs-label">ATIVO</text>

    <g class="gs-btn" data-gate-action="open" transform="translate(18 101)"><rect width="86" height="40" rx="8"/><text x="43" y="25" text-anchor="middle" class="gs-label">ABRIR</text></g>
    <g class="gs-btn" data-gate-action="stop" transform="translate(114 101)"><rect width="86" height="40" rx="8"/><text x="43" y="25" text-anchor="middle" class="gs-label">PARAR</text></g>
    <g class="gs-btn" data-gate-action="close" transform="translate(210 101)"><rect width="88" height="40" rx="8"/><text x="44" y="25" text-anchor="middle" class="gs-label">FECHAR</text></g>
    <g class="gs-btn" data-gate-action="auto" transform="translate(308 101)"><rect width="86" height="40" rx="8"/><text x="43" y="25" text-anchor="middle" class="gs-label">AUTO</text></g>
    <g class="gs-btn" data-gate-action="obstacle" transform="translate(404 101)"><rect width="114" height="40" rx="8"/><text x="57" y="25" text-anchor="middle" class="gs-label">FOTOCÉLULA</text></g>
    <g class="gs-btn" data-gate-action="reset" transform="translate(528 101)"><rect width="86" height="40" rx="8"/><text x="43" y="25" text-anchor="middle" class="gs-label">RESET</text></g>

    <circle cx="682" cy="60" r="9" data-gate-led-open="true" fill="#334155"/><text x="698" y="64" class="gs-small">FCA</text>
    <circle cx="760" cy="60" r="9" data-gate-led-close="true" fill="#334155"/><text x="776" y="64" class="gs-small">FCC</text>
    <circle cx="842" cy="60" r="9" data-gate-led-photo="true" fill="#22c55e"/><text x="858" y="64" class="gs-small">FOTO OK</text>
    <circle cx="940" cy="60" r="9" data-gate-led-run="true" fill="#334155"/><text x="956" y="64" class="gs-small">MOV</text>

    <text x="662" y="122" class="gs-small">Ciclo Premium: no modo AUTO o exemplo demonstra abertura, pausa, fechamento e reabertura por obstáculo.</text>
    <text x="662" y="144" class="gs-small">No modo manual use ABRIR / PARAR / FECHAR. Duplo clique abre o painel de laboratório.</text>
  </g>

  <g id="terminals">
    <text x="78" y="716" class="gs-small" fill="#f4d675">COMANDOS DE ENTRADA</text>
    <g data-terminal="CMD_OPEN" data-wire-side="bottom" transform="translate(182 716)" data-terminal-id="gate-system-CMD-OPEN" data-terminal-name="CMD_OPEN" data-domain="control" data-function="open-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#gs-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_OPEN" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="gs-terminal-label">ABRIR</text></g>
    <g data-terminal="CMD_STOP" data-wire-side="bottom" transform="translate(262 716)" data-terminal-id="gate-system-CMD-STOP" data-terminal-name="CMD_STOP" data-domain="control" data-function="stop-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#gs-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_STOP" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="gs-terminal-label">PARAR</text></g>
    <g data-terminal="CMD_CLOSE" data-wire-side="bottom" transform="translate(342 716)" data-terminal-id="gate-system-CMD-CLOSE" data-terminal-name="CMD_CLOSE" data-domain="control" data-function="close-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#gs-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_CLOSE" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="gs-terminal-label">FECHAR</text></g>

    <text x="536" y="716" class="gs-small" fill="#f4d675">FINS DE CURSO</text>
    <g data-terminal="COM_LIM" data-wire-side="bottom" transform="translate(620 716)" data-terminal-id="gate-system-COM-LIM" data-terminal-name="COM_LIM" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="passive" data-electrical-type="dry-contact"><use href="#gs-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="COM_LIM" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="gs-terminal-label">COM</text></g>
    <g data-terminal="FC_OPEN" data-wire-side="bottom" transform="translate(690 716)" data-terminal-id="gate-system-FC-OPEN" data-terminal-name="FC_OPEN" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#gs-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="FC_OPEN" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="gs-terminal-label">FCA</text></g>
    <g data-terminal="FC_CLOSE" data-wire-side="bottom" transform="translate(760 716)" data-terminal-id="gate-system-FC-CLOSE" data-terminal-name="FC_CLOSE" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#gs-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="FC_CLOSE" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="gs-terminal-label">FCC</text></g>

    <text x="884" y="676" class="gs-small" fill="#f4d675">FOTOCÉLULA</text>
    <g data-terminal="COM_PH" data-wire-side="right" transform="translate(1064 642)" data-terminal-id="gate-system-COM-PH" data-terminal-name="COM_PH" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="passive" data-electrical-type="dry-contact"><use href="#gs-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="COM_PH" data-wire-side="right" r="14"/><text x="-21" y="4" text-anchor="end" class="gs-terminal-label">COM</text></g>
    <g data-terminal="PHOTO_OK" data-wire-side="right" transform="translate(1064 682)" data-terminal-id="gate-system-PHOTO-OK" data-terminal-name="PHOTO_OK" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#gs-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="PHOTO_OK" data-wire-side="right" r="14"/><text x="-21" y="4" text-anchor="end" class="gs-terminal-label">LIVRE</text></g>
  </g>
</svg>
`;

  const conveyorSystemVisualFallback=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 760" role="img" aria-label="Sistema Premium de esteiras transportadoras" data-techrib-preserve-text-style="true">
  <defs>
    <linearGradient id="cv-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10232d"/><stop offset="1" stop-color="#07131a"/></linearGradient>
    <linearGradient id="cv-panel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1a3240"/><stop offset="1" stop-color="#0f1f28"/></linearGradient>
    <linearGradient id="cv-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf2f5"/><stop offset=".5" stop-color="#a8bac4"/><stop offset="1" stop-color="#50626d"/></linearGradient>
    <linearGradient id="cv-belt" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#2b3f4a"/><stop offset="1" stop-color="#101d24"/></linearGradient>
    <linearGradient id="cv-box" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f7d891"/><stop offset="1" stop-color="#d28d26"/></linearGradient>
    <filter id="cv-shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-opacity=".35"/></filter>
    <filter id="cv-glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="cv-main-belt-clip"><rect x="130" y="248" width="640" height="78" rx="24"/></clipPath>
    <g id="cv-terminal-port"><circle r="11" fill="#101a20" stroke="#f1c75b" stroke-width="3"/><circle r="5" fill="#dfe8ed"/><path d="M-4 0h8M0-4v8" stroke="#536873" stroke-width="2"/></g>
    <style>
      .cv-title{font:900 25px Arial,sans-serif;fill:#fff;letter-spacing:.5px}
      .cv-sub{font:700 12px Arial,sans-serif;fill:#9fc3d4}
      .cv-label{font:800 13px Arial,sans-serif;fill:#eaf7fb}
      .cv-small{font:700 10px Arial,sans-serif;fill:#a9c2ce}
      .cv-value{font:900 20px Arial,sans-serif;fill:#7dd3fc}
      .cv-terminal-label{font:900 11px Arial,sans-serif;fill:#f5e7ad}
      .cv-btn text{pointer-events:none}.cv-btn rect{fill:#173747;stroke:#6a8591;stroke-width:1.5}.cv-btn:hover rect{fill:#245369}.cv-btn{cursor:pointer}
      .wire-anchor-hitbox{fill:transparent;stroke:transparent;stroke-width:1}
    </style>
  </defs>
  <rect x="14" y="14" width="1072" height="732" rx="28" fill="url(#cv-bg)" stroke="#b78b25" stroke-width="4" filter="url(#cv-shadow)"/>
  <rect x="30" y="30" width="1040" height="56" rx="14" fill="#0d2c3a" stroke="#365865"/>
  <text x="52" y="64" class="cv-title">TECHRIB • SISTEMA DE ESTEIRAS TRANSPORTADORAS</text>
  <text x="1044" y="55" text-anchor="end" class="cv-sub">TRANSPORTE DE CAIXAS • CONTAGEM • SENSORES DE ENTRADA / SAÍDA</text>
  <text x="1044" y="73" text-anchor="end" class="cv-small">PARTIDA • PARADA • RESET DE FALHA • LABORATÓRIO PREMIUM</text>
  <g filter="url(#cv-shadow)">
    <rect x="54" y="120" width="740" height="294" rx="20" fill="#0b1b24" stroke="#4f6974" stroke-width="2"/>
    <text x="78" y="146" class="cv-label">LINHA DIDÁTICA DE TRANSPORTE</text>
    <text x="78" y="166" class="cv-small">esteira principal com sensores fotoelétricos, motor e descarte para área de saída</text>
    <rect x="126" y="248" width="648" height="78" rx="24" fill="url(#cv-belt)" stroke="#6c838e" stroke-width="4"/>
    <g stroke="#607784" stroke-width="4" opacity=".75">
      <path d="M168 286h552" stroke-dasharray="26 16" data-conv-flow="true" filter="url(#cv-glow)"/>
      <path d="M168 269h552" stroke-dasharray="14 12" opacity=".35"/>
      <path d="M168 304h552" stroke-dasharray="14 12" opacity=".35"/>
    </g>
    <g fill="#98aeb8"><circle cx="148" cy="286" r="20"/><circle cx="752" cy="286" r="20"/><circle cx="148" cy="286" r="8" fill="#2a3f49"/><circle cx="752" cy="286" r="8" fill="#2a3f49"/></g>
    <g clip-path="url(#cv-main-belt-clip)">
      <g data-conv-box="0" transform="translate(160 257)"><rect width="54" height="40" rx="7" fill="url(#cv-box)" stroke="#fff2c9" stroke-width="2"/><path d="M9 15h36M9 26h36" stroke="#8a5a12" stroke-width="3" opacity=".75"/></g>
      <g data-conv-box="1" transform="translate(390 257)"><rect width="54" height="40" rx="7" fill="url(#cv-box)" stroke="#fff2c9" stroke-width="2"/><path d="M9 15h36M9 26h36" stroke="#8a5a12" stroke-width="3" opacity=".75"/></g>
      <g data-conv-box="2" transform="translate(612 257)"><rect width="54" height="40" rx="7" fill="url(#cv-box)" stroke="#fff2c9" stroke-width="2"/><path d="M9 15h36M9 26h36" stroke="#8a5a12" stroke-width="3" opacity=".75"/></g>
    </g>
    <g><rect x="94" y="205" width="44" height="162" rx="8" fill="#203844" stroke="#6f8793"/><path d="M94 225h44M94 248h44M94 271h44M94 294h44M94 317h44" stroke="#6f8793" stroke-width="2"/><text x="116" y="194" text-anchor="middle" class="cv-small">ENTRADA</text></g>
    <g><rect x="778" y="215" width="18" height="142" rx="9" fill="#6c838e"/><path d="M792 286h82l26 25" fill="none" stroke="#7c939e" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M792 286h82l26 25" fill="none" stroke="#d9e5ea" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><rect x="892" y="276" width="104" height="86" rx="10" fill="#172d39" stroke="#5d7580" stroke-width="2"/><rect x="910" y="294" width="68" height="50" rx="6" fill="#0f1b22" stroke="#6f8793" stroke-dasharray="6 5"/><text x="944" y="370" text-anchor="middle" class="cv-small">ÁREA DE SAÍDA</text></g>
    <g><circle cx="214" cy="222" r="10" fill="#22c55e" data-conv-sensor-in-led="true"/><circle cx="686" cy="222" r="10" fill="#22c55e" data-conv-sensor-out-led="true"/><line x1="214" y1="232" x2="214" y2="340" stroke="#67e8f9" stroke-width="4" stroke-dasharray="8 7" data-conv-sensor-in-beam="true" filter="url(#cv-glow)"/><line x1="686" y1="232" x2="686" y2="340" stroke="#67e8f9" stroke-width="4" stroke-dasharray="8 7" data-conv-sensor-out-beam="true" filter="url(#cv-glow)"/><text x="214" y="206" text-anchor="middle" class="cv-small">SENSOR ENTRADA</text><text x="686" y="206" text-anchor="middle" class="cv-small">SENSOR SAÍDA</text></g>
    <g transform="translate(338 344)" filter="url(#cv-shadow)"><circle cx="0" cy="0" r="30" fill="#253a45" stroke="#dce7ec" stroke-width="3"/><circle cx="0" cy="0" r="13" fill="#7dd3fc" data-conv-motor-core="true"/><rect x="-52" y="18" width="104" height="18" rx="8" fill="#a2b5bf"/><text x="0" y="56" text-anchor="middle" class="cv-small">MOTOR</text></g>
  </g>
  <g transform="translate(824 122)" filter="url(#cv-shadow)">
    <rect width="222" height="292" rx="18" fill="#0b1b24" stroke="#4f6974" stroke-width="2"/>
    <text x="20" y="28" class="cv-label">PAINEL LOCAL</text>
    <text x="20" y="50" class="cv-small">estado do transportador e contagem</text>
    <text x="20" y="84" class="cv-small">Estado</text><text x="93" y="84" data-conv-status="true" class="cv-label">PRONTO</text>
    <text x="20" y="110" class="cv-small">Velocidade</text><text x="130" y="110" data-conv-speed="true" class="cv-value">55%</text>
    <text x="20" y="136" class="cv-small">Caixas</text><text x="93" y="136" data-conv-count="true" class="cv-value">0</text>
    <text x="20" y="162" class="cv-small">Modo</text><text x="93" y="162" data-conv-mode="true" class="cv-label">AUTO</text>
    <circle cx="182" cy="82" r="9" data-conv-green="true" fill="#22c55e"/><circle cx="182" cy="108" r="9" data-conv-amber="true" fill="#f59e0b" opacity=".5"/><circle cx="182" cy="134" r="9" data-conv-red="true" fill="#ef4444" opacity=".2"/>
    <g class="cv-btn" data-conv-action="auto" transform="translate(18 188)"><rect width="80" height="38" rx="8"/><text x="40" y="24" text-anchor="middle" class="cv-label">AUTO</text></g>
    <g class="cv-btn" data-conv-action="start" transform="translate(112 188)"><rect width="92" height="38" rx="8"/><text x="46" y="24" text-anchor="middle" class="cv-label">START</text></g>
    <g class="cv-btn" data-conv-action="stop" transform="translate(18 236)"><rect width="80" height="38" rx="8"/><text x="40" y="24" text-anchor="middle" class="cv-label">STOP</text></g>
    <g class="cv-btn" data-conv-action="reset" transform="translate(112 236)"><rect width="92" height="38" rx="8"/><text x="46" y="24" text-anchor="middle" class="cv-label">RESET</text></g>
    <g class="cv-btn" data-conv-action="jam" transform="translate(18 284)"><rect width="186" height="32" rx="8"/><text x="93" y="21" text-anchor="middle" class="cv-small">SIMULAR FALHA / TRAVAMENTO</text></g>
  </g>
  <g transform="translate(58 444)"><rect width="988" height="176" rx="18" fill="#0a1d27" stroke="#42616d" stroke-width="2"/><text x="20" y="28" class="cv-label">STATUS DOS SENSORES E LIGAÇÕES DE CONTROLE</text><text x="20" y="52" class="cv-small">As entradas CMD_RUN / CMD_STOP / CMD_RESET aceitam comando em 5 Vcc. Os sensores usam contatos secos independentes.</text><text x="20" y="86" class="cv-small">Sensor entrada</text><text x="160" y="86" data-conv-sensor-in-status="true" class="cv-label">LIVRE</text><text x="20" y="112" class="cv-small">Sensor saída</text><text x="160" y="112" data-conv-sensor-out-status="true" class="cv-label">LIVRE</text><text x="20" y="138" class="cv-small">Falha</text><text x="160" y="138" data-conv-jam-status="true" class="cv-label">SEM FALHA</text><text x="520" y="86" class="cv-small">Ciclo Premium</text><text x="650" y="86" data-conv-cycle="true" class="cv-label">AUTOMÁTICO</text><text x="520" y="112" class="cv-small">Objetivo</text><text x="650" y="112" class="cv-small">transportar caixas, detectar presença e contar peças processadas</text><text x="520" y="138" class="cv-small">Dica</text><text x="650" y="138" class="cv-small">duplo clique abre o laboratório com ajustes e testes avançados</text></g>
  <g id="terminals">
    <text x="70" y="702" class="cv-small" fill="#f4d675">COMANDOS DE ENTRADA</text>
    <g data-terminal="CMD_RUN" data-wire-side="bottom" transform="translate(178 706)" data-terminal-id="conv-system-CMD-RUN" data-terminal-name="CMD_RUN" data-domain="control" data-function="run-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#cv-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_RUN" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cv-terminal-label">START</text></g>
    <g data-terminal="CMD_STOP" data-wire-side="bottom" transform="translate(268 706)" data-terminal-id="conv-system-CMD-STOP" data-terminal-name="CMD_STOP" data-domain="control" data-function="stop-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#cv-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_STOP" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cv-terminal-label">STOP</text></g>
    <g data-terminal="CMD_RESET" data-wire-side="bottom" transform="translate(358 706)" data-terminal-id="conv-system-CMD-RESET" data-terminal-name="CMD_RESET" data-domain="control" data-function="reset-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#cv-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_RESET" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cv-terminal-label">RESET</text></g>
    <text x="506" y="702" class="cv-small" fill="#f4d675">SENSORES DE SAÍDA (CONTATOS SECOS)</text>
    <g data-terminal="COM_IN" data-wire-side="bottom" transform="translate(632 706)" data-terminal-id="conv-system-COM-IN" data-terminal-name="COM_IN" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="passive" data-electrical-type="dry-contact"><use href="#cv-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="COM_IN" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cv-terminal-label">COM IN</text></g>
    <g data-terminal="SENSOR_IN" data-wire-side="bottom" transform="translate(716 706)" data-terminal-id="conv-system-SENSOR-IN" data-terminal-name="SENSOR_IN" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#cv-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="SENSOR_IN" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cv-terminal-label">ENTRADA</text></g>
    <g data-terminal="COM_OUT" data-wire-side="bottom" transform="translate(806 706)" data-terminal-id="conv-system-COM-OUT" data-terminal-name="COM_OUT" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="passive" data-electrical-type="dry-contact"><use href="#cv-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="COM_OUT" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cv-terminal-label">COM OUT</text></g>
    <g data-terminal="SENSOR_OUT" data-wire-side="bottom" transform="translate(896 706)" data-terminal-id="conv-system-SENSOR-OUT" data-terminal-name="SENSOR_OUT" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#cv-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="SENSOR_OUT" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cv-terminal-label">SAÍDA</text></g>
    <g data-terminal="COM_JAM" data-wire-side="bottom" transform="translate(986 706)" data-terminal-id="conv-system-COM-JAM" data-terminal-name="COM_JAM" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="passive" data-electrical-type="dry-contact"><use href="#cv-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="COM_JAM" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cv-terminal-label">COM JAM</text></g>
    <g data-terminal="JAM_OK" data-wire-side="right" transform="translate(1058 650)" data-terminal-id="conv-system-JAM-OK" data-terminal-name="JAM_OK" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#cv-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="JAM_OK" data-wire-side="right" r="14"/><text x="-20" y="4" text-anchor="end" class="cv-terminal-label">SEM FALHA</text></g>
  </g>
</svg>
`;

  const craneSystemVisualFallback=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 760" role="img" aria-label="Sistema Premium de pontes rolantes" data-techrib-preserve-text-style="true">
  <defs>
    <linearGradient id="cr-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10242f"/><stop offset="1" stop-color="#07131a"/></linearGradient>
    <linearGradient id="cr-panel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1c3341"/><stop offset="1" stop-color="#0f2028"/></linearGradient>
    <linearGradient id="cr-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eff4f7"/><stop offset=".5" stop-color="#b3c2cb"/><stop offset="1" stop-color="#60717b"/></linearGradient>
    <linearGradient id="cr-bridge" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#f6d36b"/><stop offset="1" stop-color="#c88b19"/></linearGradient>
    <linearGradient id="cr-load" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffca8a"/><stop offset="1" stop-color="#be5a1a"/></linearGradient>
    <filter id="cr-shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-opacity=".35"/></filter>
    <filter id="cr-glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <g id="cr-terminal-port"><circle r="11" fill="#101a20" stroke="#f1c75b" stroke-width="3"/><circle r="5" fill="#dfe8ed"/><path d="M-4 0h8M0-4v8" stroke="#536873" stroke-width="2"/></g>
    <style>
      .cr-title{font:900 25px Arial,sans-serif;fill:#fff;letter-spacing:.5px}
      .cr-sub{font:700 12px Arial,sans-serif;fill:#9fc3d4}
      .cr-label{font:800 13px Arial,sans-serif;fill:#eaf7fb}
      .cr-small{font:700 10px Arial,sans-serif;fill:#a9c2ce}
      .cr-value{font:900 20px Arial,sans-serif;fill:#7dd3fc}
      .cr-terminal-label{font:900 11px Arial,sans-serif;fill:#f5e7ad}
      .cr-btn text{pointer-events:none}.cr-btn rect{fill:#173747;stroke:#6a8591;stroke-width:1.5}.cr-btn:hover rect{fill:#245369}.cr-btn{cursor:pointer}
      .wire-anchor-hitbox{fill:transparent;stroke:transparent;stroke-width:1}
    </style>
  </defs>
  <rect x="14" y="14" width="1072" height="732" rx="28" fill="url(#cr-bg)" stroke="#b78b25" stroke-width="4" filter="url(#cr-shadow)"/>
  <rect x="30" y="30" width="1040" height="56" rx="14" fill="#0d2c3a" stroke="#365865"/>
  <text x="52" y="64" class="cr-title">TECHRIB • SISTEMA DE PONTES ROLANTES</text>
  <text x="1044" y="55" text-anchor="end" class="cr-sub">TRANSLAÇÃO HORIZONTAL • IÇAMENTO • FINS DE CURSO • CARGA SUSPENSA</text>
  <text x="1044" y="73" text-anchor="end" class="cr-small">QUALIDADE PREMIUM • ANIMAÇÃO DIDÁTICA • CONTROLE LOCAL E EXTERNO</text>

  <g filter="url(#cr-shadow)">
    <rect x="56" y="116" width="742" height="326" rx="20" fill="#0b1b24" stroke="#4f6974" stroke-width="2"/>
    <text x="78" y="144" class="cr-label">PONTE ROLANTE DIDÁTICA</text>
    <text x="78" y="164" class="cr-small">estrutura com trilhos laterais, viga principal, carro e gancho com carga simulada</text>

    <rect x="104" y="188" width="30" height="190" rx="10" fill="#28414c" stroke="#87a4b1" stroke-width="2"/>
    <rect x="722" y="188" width="30" height="190" rx="10" fill="#28414c" stroke="#87a4b1" stroke-width="2"/>
    <rect x="126" y="202" width="604" height="20" rx="10" fill="#8097a3"/>
    <rect x="126" y="214" width="604" height="12" rx="6" fill="#4d6672"/>
    <text x="127" y="194" class="cr-small">LIMITE ESQ.</text>
    <text x="710" y="194" text-anchor="end" class="cr-small">LIMITE DIR.</text>

    <g data-crane-bridge="true" transform="translate(170 0)">
      <rect x="0" y="226" width="320" height="34" rx="12" fill="url(#cr-bridge)" stroke="#fff0b3" stroke-width="2"/>
      <rect x="18" y="218" width="38" height="50" rx="10" fill="#283943" stroke="#8aa0ac" stroke-width="2"/>
      <rect x="264" y="218" width="38" height="50" rx="10" fill="#283943" stroke="#8aa0ac" stroke-width="2"/>
      <circle cx="36" cy="258" r="10" fill="#0f1d24" stroke="#b5c6cf"/><circle cx="284" cy="258" r="10" fill="#0f1d24" stroke="#b5c6cf"/>
      <g data-crane-hoist="true" transform="translate(148 0)">
        <rect x="0" y="214" width="64" height="52" rx="10" fill="#1b2f3a" stroke="#93aab6" stroke-width="2"/>
        <circle cx="32" cy="238" r="12" fill="#7dd3fc" data-crane-motor-core="true"/>
        <path d="M32 266v90" stroke="#d9e5ea" stroke-width="4" stroke-dasharray="5 5" data-crane-cable="true" filter="url(#cr-glow)"/>
        <g data-crane-hook="true" transform="translate(32 356)">
          <circle cx="0" cy="0" r="11" fill="#f8b25e"/>
          <path d="M0 10v18c0 10-8 18-18 18h-6" fill="none" stroke="#f8b25e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
          <g data-crane-load="true" transform="translate(-34 40)">
            <rect width="68" height="44" rx="8" fill="url(#cr-load)" stroke="#ffe0ba" stroke-width="2"/>
            <path d="M10 18h48M10 28h48" stroke="#8a4719" stroke-width="3" opacity=".75"/>
          </g>
        </g>
      </g>
      <text x="160" y="210" text-anchor="middle" class="cr-small">CARRO + TALHA</text>
    </g>

    <g>
      <rect x="260" y="406" width="342" height="12" rx="6" fill="#1a2e38" stroke="#566d79"/>
      <text x="270" y="399" class="cr-small">ÁREA DE MOVIMENTAÇÃO DA CARGA</text>
    </g>
  </g>

  <g transform="translate(824 118)" filter="url(#cr-shadow)">
    <rect width="224" height="322" rx="18" fill="#0b1b24" stroke="#4f6974" stroke-width="2"/>
    <text x="20" y="28" class="cr-label">PAINEL LOCAL</text>
    <text x="20" y="50" class="cr-small">comandos rápidos e supervisão</text>
    <text x="20" y="84" class="cr-small">Estado</text><text x="92" y="84" data-cr-status="true" class="cr-label">PRONTO</text>
    <text x="20" y="110" class="cr-small">Posição X</text><text x="128" y="110" data-cr-x="true" class="cr-value">0%</text>
    <text x="20" y="136" class="cr-small">Altura</text><text x="128" y="136" data-cr-z="true" class="cr-value">0%</text>
    <text x="20" y="162" class="cr-small">Modo</text><text x="92" y="162" data-cr-mode="true" class="cr-label">AUTO</text>
    <text x="20" y="188" class="cr-small">Carga</text><text x="92" y="188" data-cr-load="true" class="cr-label">PRESENTE</text>
    <circle cx="188" cy="82" r="9" data-cr-green="true" fill="#22c55e"/><circle cx="188" cy="108" r="9" data-cr-amber="true" fill="#f59e0b" opacity=".5"/><circle cx="188" cy="134" r="9" data-cr-red="true" fill="#ef4444" opacity=".2"/>
    <g class="cr-btn" data-crane-action="auto" transform="translate(16 210)"><rect width="84" height="36" rx="8"/><text x="42" y="23" text-anchor="middle" class="cr-label">AUTO</text></g>
    <g class="cr-btn" data-crane-action="left" transform="translate(114 210)"><rect width="94" height="36" rx="8"/><text x="47" y="23" text-anchor="middle" class="cr-label">ESQ</text></g>
    <g class="cr-btn" data-crane-action="right" transform="translate(16 256)"><rect width="84" height="36" rx="8"/><text x="42" y="23" text-anchor="middle" class="cr-label">DIR</text></g>
    <g class="cr-btn" data-crane-action="up" transform="translate(114 256)"><rect width="94" height="36" rx="8"/><text x="47" y="23" text-anchor="middle" class="cr-label">SUBIR</text></g>
    <g class="cr-btn" data-crane-action="down" transform="translate(16 302)"><rect width="84" height="36" rx="8"/><text x="42" y="23" text-anchor="middle" class="cr-label">DESCER</text></g>
    <g class="cr-btn" data-crane-action="stop" transform="translate(114 302)"><rect width="94" height="36" rx="8"/><text x="47" y="23" text-anchor="middle" class="cr-label">STOP</text></g>
    <g class="cr-btn" data-crane-action="load" transform="translate(16 348)"><rect width="192" height="34" rx="8"/><text x="96" y="22" text-anchor="middle" class="cr-small">SIMULAR CARGA / DESCARGA</text></g>
  </g>

  <g transform="translate(58 456)">
    <rect width="990" height="162" rx="18" fill="#0a1d27" stroke="#42616d" stroke-width="2"/>
    <text x="20" y="28" class="cr-label">STATUS DA PONTE ROLANTE</text>
    <text x="20" y="52" class="cr-small">Entradas CMD_LEFT/CMD_RIGHT/CMD_UP/CMD_DOWN/CMD_STOP em 5 Vcc. Saídas em contatos secos de fim de curso e presença de carga.</text>
    <text x="20" y="84" class="cr-small">Fim de curso esquerdo</text><text x="184" y="84" data-cr-l-left="true" class="cr-label">ATIVO</text>
    <text x="20" y="110" class="cr-small">Fim de curso direito</text><text x="184" y="110" data-cr-l-right="true" class="cr-label">LIVRE</text>
    <text x="20" y="136" class="cr-small">Fim de curso superior</text><text x="184" y="136" data-cr-l-up="true" class="cr-label">ATIVO</text>
    <text x="390" y="84" class="cr-small">Fim de curso inferior</text><text x="560" y="84" data-cr-l-down="true" class="cr-label">LIVRE</text>
    <text x="390" y="110" class="cr-small">Carga presente</text><text x="560" y="110" data-cr-l-load="true" class="cr-label">SIM</text>
    <text x="390" y="136" class="cr-small">Movimento</text><text x="560" y="136" data-cr-motion="true" class="cr-label">PARADO</text>
    <text x="740" y="92" class="cr-small">Dica</text><text x="804" y="92" class="cr-small">duplo clique abre o laboratório para ajustes</text>
    <text x="740" y="122" class="cr-small">Ciclo demo</text><text x="832" y="122" data-cr-cycle="true" class="cr-label">AUTOMÁTICO</text>
  </g>

  <g id="terminals">
    <text x="70" y="704" class="cr-small" fill="#f4d675">COMANDOS DE ENTRADA</text>
    <g data-terminal="CMD_LEFT" data-wire-side="bottom" transform="translate(152 708)" data-terminal-id="crane-system-CMD-LEFT" data-terminal-name="CMD_LEFT" data-domain="control" data-function="move-left-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_LEFT" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">ESQ</text></g>
    <g data-terminal="CMD_RIGHT" data-wire-side="bottom" transform="translate(236 708)" data-terminal-id="crane-system-CMD-RIGHT" data-terminal-name="CMD_RIGHT" data-domain="control" data-function="move-right-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_RIGHT" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">DIR</text></g>
    <g data-terminal="CMD_UP" data-wire-side="bottom" transform="translate(320 708)" data-terminal-id="crane-system-CMD-UP" data-terminal-name="CMD_UP" data-domain="control" data-function="move-up-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_UP" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">SUBIR</text></g>
    <g data-terminal="CMD_DOWN" data-wire-side="bottom" transform="translate(404 708)" data-terminal-id="crane-system-CMD-DOWN" data-terminal-name="CMD_DOWN" data-domain="control" data-function="move-down-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_DOWN" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">DESCER</text></g>
    <g data-terminal="CMD_STOP" data-wire-side="bottom" transform="translate(488 708)" data-terminal-id="crane-system-CMD-STOP" data-terminal-name="CMD_STOP" data-domain="control" data-function="stop-command" data-voltage-class="5v" data-direction="input" data-electrical-type="logic-input"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="CMD_STOP" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">STOP</text></g>
    <text x="602" y="704" class="cr-small" fill="#f4d675">FINS DE CURSO / SINAIS</text>
    <g data-terminal="COM_H" data-wire-side="bottom" transform="translate(650 708)" data-terminal-id="crane-system-COM-H" data-terminal-name="COM_H" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="passive" data-electrical-type="dry-contact"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="COM_H" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">COM H</text></g>
    <g data-terminal="LIM_LEFT" data-wire-side="bottom" transform="translate(734 708)" data-terminal-id="crane-system-LIM-LEFT" data-terminal-name="LIM_LEFT" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="LIM_LEFT" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">FC ESQ</text></g>
    <g data-terminal="LIM_RIGHT" data-wire-side="bottom" transform="translate(822 708)" data-terminal-id="crane-system-LIM-RIGHT" data-terminal-name="LIM_RIGHT" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="LIM_RIGHT" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">FC DIR</text></g>
    <g data-terminal="COM_V" data-wire-side="bottom" transform="translate(910 708)" data-terminal-id="crane-system-COM-V" data-terminal-name="COM_V" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="passive" data-electrical-type="dry-contact"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="COM_V" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">COM V</text></g>
    <g data-terminal="LIM_UP" data-wire-side="bottom" transform="translate(992 708)" data-terminal-id="crane-system-LIM-UP" data-terminal-name="LIM_UP" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="LIM_UP" data-wire-side="bottom" r="14"/><text x="0" y="-19" text-anchor="middle" class="cr-terminal-label">FC SUP</text></g>
    <g data-terminal="LIM_DOWN" data-wire-side="right" transform="translate(1058 650)" data-terminal-id="crane-system-LIM-DOWN" data-terminal-name="LIM_DOWN" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="LIM_DOWN" data-wire-side="right" r="14"/><text x="-20" y="4" text-anchor="end" class="cr-terminal-label">FC INF</text></g>
    <g data-terminal="COM_LOAD" data-wire-side="right" transform="translate(1058 602)" data-terminal-id="crane-system-COM-LOAD" data-terminal-name="COM_LOAD" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="passive" data-electrical-type="dry-contact"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="COM_LOAD" data-wire-side="right" r="14"/><text x="-20" y="4" text-anchor="end" class="cr-terminal-label">COM LD</text></g>
    <g data-terminal="LOAD_OK" data-wire-side="right" transform="translate(1058 554)" data-terminal-id="crane-system-LOAD-OK" data-terminal-name="LOAD_OK" data-domain="control" data-function="dry-contact" data-voltage-class="dry-contact" data-direction="output" data-electrical-type="dry-contact-no"><use href="#cr-terminal-port"/><circle class="wire-anchor-hitbox" data-wire-anchor="LOAD_OK" data-wire-side="right" r="14"/><text x="-20" y="4" text-anchor="end" class="cr-terminal-label">CARGA</text></g>
  </g>
</svg>
`;

  const FALLBACKS=Object.freeze({
    'sistema-bombeamento-reservatorios':pumpSystemVisualFallback,
    'sistema-portoes-automaticos':gateSystemVisualFallback,
    'sistema-esteiras-transportadoras':conveyorSystemVisualFallback,
    'sistema-pontes-rolantes':craneSystemVisualFallback
  });

  const install=(options={})=>{
    const visuals=options.visuals||root.TECHRIB_COMPONENT_VISUALS||{};
    const urls=options.urls||root.TECHRIB_COMPONENT_VISUAL_URLS||{};
    const runtimeFallbacks={};
    Object.entries(FALLBACKS).forEach(([type,svg])=>{
      runtimeFallbacks[type]=svg;
      if(!urls[type]&&!String(visuals[type]||'').trim())visuals[type]=svg;
    });
    root.TECHRIB_COMPONENT_VISUALS=visuals;
    return runtimeFallbacks;
  };

  root.TechRibPremiumVisualFallbacksV30=Object.freeze({VERSION,FALLBACKS,install,types:Object.freeze(Object.keys(FALLBACKS))});
})(typeof window!=='undefined'?window:globalThis);
