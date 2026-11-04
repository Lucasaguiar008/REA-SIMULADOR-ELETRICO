# ⚡ Simulador Elétrico LucasAguiar

Aplicação web interativa de **CAD e Simulação de Comandos Elétricos, Automação Industrial, Eletrônica Digital, Microcontroladores (ESP32 / Arduino / Raspberry Pi Pico) e Automação Predial (KNX / DALI-2)** com interface em tema claro de engenharia e funcionamento 100% no navegador.

---

## ✨ Principais Recursos

- **Ambiente CAD em Prancha Técnica (A0 a A5):**
  - Folha esquemática com fundo branco de alta legibilidade, grade técnica configurável (`mm`), escalas padronizadas e carimbo técnico editável (**LucasAguiar Automação & Desenvolvimento**).
  - Roteamento ortogonal automático de condutores com desvio inteligente de obstáculos via WebAssembly (`libavoid-v031.wasm`).
  - Numeração automática de anilhas/fios, escolha de bitolas (`mm²`), cores normalizadas (Fase, Neutro, Terra `PE`, Comando e Lógica), bornes, junções e eletrodutos.
- **Motor de Simulação em Tempo Real:**
  - Cálculo de redes elétricas CA/CC (monofásica, bifásica e trifásica `220 V / 380 V` e fontes `3,3 V / 5 V / 12 V / 24 Vcc`).
  - Simulação física e funcional de contatores, disjuntores termomagnéticos, IDR/DR, relés térmicos de sobrecarga (com curva de disparo e rearme), temporizadores (`TON`), soft-starters, inversores de frequência (VFD), motores trifásicos e bombas.
  - Simulação de barramentos prediais **KNX** e iluminação endereçável **DALI / DALI-2**.
  - Simulação de microcontroladores (**ESP32 DevKit V1**, **ESP32-S3**, **Arduino UNO / Mega / Nano**, **Raspberry Pi Pico W**) integrados a relés, displays LCD `16×2` / `20×4`, OLED, sensores e atuadores industriais.
- **Diagnóstico Elétrico e Gerador de Código:**
  - **Diagnóstico Topológico:** verifica curto-circuitos, falta de fase, ausência de condutor de proteção (`PE`), bobinas com tensão incompatível e entradas flutuantes.
  - **Gerador de Código:** exporta código validado para microcontroladores a partir da topologia real ligada na prancha.
  - **Passo a Passo de Ligação:** gera roteiro guiado da montagem elétrica.
- **Funcionamento Direto (Sem Login) & Persistência Local (`localStorage`):**
  - Abre diretamente na área de trabalho sem exigir cadastro, login ou servidor de banco de dados.
  - **Auto-save automático:** qualquer alteração na prancha é salva automaticamente na memória local do navegador (`localStorage`) e restaurada ao reabrir a página.
  - **Gerenciador de Projetos Local:** permite salvar múltiplos projetos no navegador (com histórico de até 15 versões por projeto), criar exemplos próprios em **Meus exemplos**, além de exportar e importar arquivos `.json` ou imprimir em PDF.

---

## 📚 Biblioteca de Componentes e Exemplos Inclusos

| Área | Exemplos de Componentes Disponíveis |
| :--- | :--- |
| **Comandos Elétricos & Potência** | Fontes 1F/2F/3F configuráveis, Disjuntores 1P/2P/3P, Disjuntor-Motor (MPCB), DR, DPS, Contatores Tripolares e 4P, Blocos Auxiliares NA/NF, Relé Térmico, Relé Falta de Fase, Temporizador TON, Botoeiras, Chaves Seccionadoras e Motores Trifásicos |
| **Automação Industrial & Máquinas** | Soft-Starter, Inversores de Frequência (Delta MS300 / Provolt PI550), Elevador de 4 Andares, Sistema de Bombeamento e Reservatórios, Esteiras Transportadoras, Portões Automáticos e Ponte Rolante |
| **Microcontroladores & Eletrônica** | ESP32 DevKit V1, ESP32-C3/S3, Arduino UNO R3 / Mega 2560 / Nano, Raspberry Pi Pico W, Módulos Relé (1, 2, 4, 8, 16 e 32 canais), Expansores I²C (`PCF8574`), Registradores (`74HC595` / `74HC165`), Displays LCD/OLED, Sensores e Drivers |
| **Instalações Residenciais & Prediais** | Interruptores Simples, Paralelo (Three-Way), Intermediário (Four-Way), Tomadas, Lâmpadas, Ventilador de Teto, Acopladores e Atuadores **KNX** e **DALI-2** |
| **Instrumentação & Medição** | Multímetro Digital, Amperímetro, Voltímetro, Medidor Multifunção Trifásico, Megômetro e Osciloscópio de 2 Canais |

---

## 🚀 Como Executar Localmente

### Opção 1: Servidor Node.js incluso
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado e execute:

```bash
node server.js
```

Em seguida, acesse no navegador:
- **http://127.0.0.1:3000/app**

### Opção 2: Qualquer servidor HTTP estático
Como o projeto conta com o adaptador estático [`assets/github-pages-shim.js`](./assets/github-pages-shim.js), ele também pode ser servido por qualquer servidor de arquivos estáticos (como `npx serve`, `python -m http.server` ou extensão **Live Server** do VS Code).

---

## 🌐 Publicação no GitHub Pages

O projeto já está configurado para rodar gratuitamente no **GitHub Pages** (incluindo [`.nojekyll`](./.nojekyll), [`404.html`](./404.html) e resolução automática de rotas em [`assets/github-pages-shim.js`](./assets/github-pages-shim.js)):

1. Suba os arquivos deste diretório para um repositório público no GitHub:
   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "Publicar Simulador Elétrico LucasAguiar"
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```
2. No GitHub, acesse **Settings** → **Pages**.
3. Em **Build and deployment** → **Branch**, selecione `main` e `/ (root)` e clique em **Save**.
4. O simulador ficará disponível publicamente em `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

---

## 📁 Estrutura de Pastas

```text
├── index.html                  # Aplicação principal (tema branco, marca LucasAguiar)
├── app.html                    # Entrada alternativa compatível com /app
├── 404.html                    # Fallback SPA para rotas estáticas no GitHub Pages
├── .nojekyll                   # Desativa processamento Jekyll no GitHub Pages
├── server.js                   # Servidor HTTP local (Node.js) com fallback automático de porta
├── api/                        # Catálogo estático de circuitos e exemplos (JSON)
│   ├── standard-examples.json  # Exemplos padrão de comandos elétricos e automação
│   ├── premium-examples.json   # Exemplos avançados (ESP32, KNX, DALI, plantas industriais)
│   └── saas-example-library.json
└── assets/                     # Estilos, motor de simulação, SVGs e WebAssembly
    ├── white-theme.css         # Folha de estilo do tema de fundo branco
    ├── github-pages-shim.js    # Adaptador de rotas e API para hospedagem 100% estática
    ├── app-v51.js              # Núcleo do simulador e editor CAD
    ├── saas-access-v1.js       # Liberação total de recursos e restauração via localStorage
    ├── libavoid-v031.wasm      # Motor WebAssembly de roteamento ortogonal de fios
    ├── component-registry/     # Biblioteca de componentes vetoriais (.svg)
    ├── runtime/                # Módulos de persistência localStorage, exemplos e codegen
    └── sounds/                 # Efeitos sonoros de atuação e máquinas (.wav)
```

---

## 👤 Autor

**Lucas Aguiar** — *LucasAguiar Automação & Desenvolvimento*
