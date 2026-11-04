(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.TechRibIdfProjectGenerator=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION='20C.1';
  const enc=()=>new TextEncoder();
  const cleanName=(value,fallback='techrib_project')=>{
    let out=String(value||'').trim().toLowerCase().normalize?.('NFD').replace(/[\u0300-\u036f]/g,'')||'';
    out=out.replace(/[^a-z0-9_\-]+/g,'_').replace(/_+/g,'_').replace(/^[_\-]+|[_\-]+$/g,'');
    if(!out)out=fallback;
    if(/^\d/.test(out))out='tr_'+out;
    return out.slice(0,63);
  };
  const cIdent=(value,fallback='PIN')=>{
    let out=String(value||'').toUpperCase().replace(/[^A-Z0-9_]+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'');
    if(!out)out=fallback;
    if(/^\d/.test(out))out='_'+out;
    return out;
  };
  const header=(file,extra='')=>`/*\n * ${file}\n * Código gerado automaticamente pelo Simulador TechRib.\n * © 2026 TechRib. Todos os direitos reservados.\n * Gerador: TechRib Code Generator V2 / Etapa 20C\n * Generator ID: TR-CODEGEN-20C\n *\n * Este cabeçalho identifica código gerado pelo TechRib.\n * APIs e bibliotecas do ESP-IDF permanecem sob as licenças dos respectivos autores.\n${extra?` * ${extra}\n`:''} */\n`;
  const commentHeader=(prefix,file)=>[
    `${prefix} ${file}`,
    `${prefix} Código gerado automaticamente pelo Simulador TechRib.`,
    `${prefix} © 2026 TechRib. Todos os direitos reservados.`,
    `${prefix} Generator ID: TR-CODEGEN-20C`,
    ''
  ].join('\n');
  const normalizePins=pins=>(Array.isArray(pins)?pins:[]).filter(p=>Number.isInteger(Number(p.number))).map(p=>({
    pin:String(p.pin||`GPIO${p.number}`),number:Number(p.number),mode:String(p.mode||'unknown').toLowerCase(),reason:String(p.reason||''),connections:Array.isArray(p.connections)?p.connections.map(String):[],label:String(p.label||'')
  }));
  function projectSnapshot(input={}){
    const pins=normalizePins(input.pins);
    const rules=Array.isArray(input.rules)?input.rules:(Array.isArray(input.program?.rules)?input.program.rules:[]);
    const target=String(input.idfTarget||'esp32').toLowerCase();
    const controller=String(input.controllerLabel||'ESP32');
    const projectName=cleanName(input.projectName||`techrib_${controller}`,'techrib_esp32');
    return{projectName,target,controller,pins,rules,profileLabel:String(input.profileLabel||''),generatedAt:String(input.generatedAt||new Date().toISOString())};
  }
  const pinByName=(snap,name)=>snap.pins.find(p=>p.pin.toUpperCase()===String(name||'').toUpperCase());
  const isOutput=p=>p.mode==='output';
  const isPullup=p=>p.mode==='input_pullup'||p.mode==='input-pullup';
  const isInput=p=>!isOutput(p)&&['input','input_pullup','input-pullup','analog-input'].includes(p.mode);
  const gpioConst=p=>`GPIO_NUM_${p.number}`;
  const mask=pins=>pins.length?pins.map(p=>`(1ULL << ${gpioConst(p)})`).join(' | '):'0';
  function buildGeneratedHeader(s){
    const lines=[header('techrib_generated.h'), '#pragma once','','#define TECHRIB_GENERATED_CODE 1','#define TECHRIB_GENERATOR_ID "TR-CODEGEN-20C"','#define TECHRIB_GENERATOR_VERSION "20C.1"','#define TECHRIB_COPYRIGHT_NOTICE "© 2026 TechRib - Todos os direitos reservados"',`#define TECHRIB_IDF_TARGET "${s.target}"`,`#define TECHRIB_PROJECT_NAME "${s.projectName}"`,''];
    s.pins.forEach(p=>{lines.push(`#define TECHRIB_PIN_${cIdent(p.pin)} ${gpioConst(p)} /* ${p.connections.join(' | ')||p.reason||p.mode} */`)});
    lines.push('');return lines.join('\n');
  }
  function buildIoHeader(){return header('techrib_io.h')+'#pragma once\n\n#include "driver/gpio.h"\n\nvoid techrib_io_init(void);\nint techrib_io_read(gpio_num_t pin);\nvoid techrib_io_write(gpio_num_t pin, int level);\n';}
  function buildIoSource(s){
    const outputs=s.pins.filter(isOutput),pullups=s.pins.filter(isPullup),inputs=s.pins.filter(p=>isInput(p)&&!isPullup(p));
    const lines=[header('techrib_io.c'),'#include "techrib_io.h"','#include "techrib_generated.h"','#include "esp_err.h"','', 'void techrib_io_init(void)','{','    gpio_config_t cfg = {0};'];
    if(outputs.length){lines.push('',`    cfg.pin_bit_mask = ${mask(outputs)};`,'    cfg.mode = GPIO_MODE_OUTPUT;','    cfg.pull_up_en = GPIO_PULLUP_DISABLE;','    cfg.pull_down_en = GPIO_PULLDOWN_DISABLE;','    cfg.intr_type = GPIO_INTR_DISABLE;','    ESP_ERROR_CHECK(gpio_config(&cfg));');outputs.forEach(p=>lines.push(`    gpio_set_level(${gpioConst(p)}, 0); /* estado seguro inicial */`));}
    if(pullups.length){lines.push('',`    cfg.pin_bit_mask = ${mask(pullups)};`,'    cfg.mode = GPIO_MODE_INPUT;','    cfg.pull_up_en = GPIO_PULLUP_ENABLE;','    cfg.pull_down_en = GPIO_PULLDOWN_DISABLE;','    cfg.intr_type = GPIO_INTR_DISABLE;','    ESP_ERROR_CHECK(gpio_config(&cfg));');}
    if(inputs.length){lines.push('',`    cfg.pin_bit_mask = ${mask(inputs)};`,'    cfg.mode = GPIO_MODE_INPUT;','    cfg.pull_up_en = GPIO_PULLUP_DISABLE;','    cfg.pull_down_en = GPIO_PULLDOWN_DISABLE;','    cfg.intr_type = GPIO_INTR_DISABLE;','    ESP_ERROR_CHECK(gpio_config(&cfg));');}
    lines.push('}','', 'int techrib_io_read(gpio_num_t pin)','{','    return gpio_get_level(pin);','}','','void techrib_io_write(gpio_num_t pin, int level)','{','    gpio_set_level(pin, level ? 1 : 0);','}','');return lines.join('\n');
  }
  function supportedRules(s){
    const supported=[],unsupported=[];
    s.rules.forEach((r,i)=>{
      const type=String(r?.type||'').toLowerCase();
      if(type!=='toggle'){unsupported.push({index:i,rule:r,reason:`tipo ${type||'(vazio)'} ainda não suportado pelo gerador ESP-IDF 20C`});return;}
      const trigger=pinByName(s,r?.trigger?.pin),output=pinByName(s,r?.output);
      if(!trigger||!output||!isInput(trigger)||!isOutput(output)){unsupported.push({index:i,rule:r,reason:'pinos de trigger/output não encontrados ou com direção incompatível'});return;}
      supported.push({index:i,rule:r,trigger,output,active:String(r?.trigger?.active||'LOW').toUpperCase()==='HIGH'?1:0,memory:cIdent(r?.memory||`RULE_${i}`)});
    });
    return{supported,unsupported};
  }
  function buildControlHeader(){return header('techrib_control.h')+'#pragma once\n\nvoid techrib_control_init(void);\nvoid techrib_control_step(void);\n';}
  function buildControlSource(s){
    const {supported,unsupported}=supportedRules(s);
    const lines=[header('techrib_control.c'),'#include <stdbool.h>','#include "freertos/FreeRTOS.h"','#include "freertos/task.h"','#include "techrib_io.h"','#include "techrib_generated.h"','','#define TECHRIB_DEBOUNCE_MS 35','','typedef struct {','    int last_raw;','    int stable_raw;','    TickType_t changed_at;','    bool output_state;','} techrib_toggle_state_t;',''];
    supported.forEach((x,i)=>lines.push(`static techrib_toggle_state_t tr_rule_${i}; /* ${x.trigger.pin} -> ${x.output.pin} */`));
    if(!supported.length)lines.push('/* Nenhuma regra toggle válida foi encontrada. O projeto permanece compilável e com saídas em estado seguro. */');
    lines.push('','void techrib_control_init(void)','{');
    supported.forEach((x,i)=>{lines.push(`    tr_rule_${i}.last_raw = techrib_io_read(${gpioConst(x.trigger)});`,`    tr_rule_${i}.stable_raw = tr_rule_${i}.last_raw;`,`    tr_rule_${i}.changed_at = xTaskGetTickCount();`,`    tr_rule_${i}.output_state = false;`,`    techrib_io_write(${gpioConst(x.output)}, 0);`);});
    lines.push('}','', 'void techrib_control_step(void)','{','    const TickType_t now = xTaskGetTickCount();');
    supported.forEach((x,i)=>{lines.push('',`    /* Regra ${i+1}: ${x.trigger.pin} (${x.active?'HIGH':'LOW'}) alterna ${x.output.pin}. Gerada pelo TechRib. */`,`    const int raw_${i} = techrib_io_read(${gpioConst(x.trigger)});`,`    if (raw_${i} != tr_rule_${i}.last_raw) {`,`        tr_rule_${i}.last_raw = raw_${i};`,`        tr_rule_${i}.changed_at = now;`,'    }',`    if (raw_${i} != tr_rule_${i}.stable_raw && (now - tr_rule_${i}.changed_at) >= pdMS_TO_TICKS(TECHRIB_DEBOUNCE_MS)) {`,`        tr_rule_${i}.stable_raw = raw_${i};`,`        if (tr_rule_${i}.stable_raw == ${x.active}) {`,`            tr_rule_${i}.output_state = !tr_rule_${i}.output_state;`,`            techrib_io_write(${gpioConst(x.output)}, tr_rule_${i}.output_state ? 1 : 0);`,'        }','    }');});
    if(unsupported.length){lines.push('','    /* Regras não implementadas automaticamente pelo gerador 20C:');unsupported.forEach(u=>lines.push(`     * - regra ${u.index+1}: ${u.reason}`));lines.push('     */');}
    lines.push('}','');return{source:lines.join('\n'),unsupported};
  }
  function buildMetadataHeader(){return header('techrib_metadata.h')+'#pragma once\n\nextern const char techrib_generator_notice[];\nextern const char techrib_project_notice[];\n';}
  function buildMetadataSource(s){return header('techrib_metadata.c','Metadados discretos de procedência do gerador, sem alterar a lógica da aplicação.')+'#include "techrib_metadata.h"\n\nconst char techrib_generator_notice[] __attribute__((used)) =\n    "© 2026 TechRib. Todos os direitos reservados. Generated by TR-CODEGEN-20C";\n\nconst char techrib_project_notice[] __attribute__((used)) =\n    "TechRib project: '+s.projectName.replace(/"/g,'')+' | target: '+s.target+'";\n';}
  function buildAppMain(){return header('app_main.c')+'#include "freertos/FreeRTOS.h"\n#include "freertos/task.h"\n#include "techrib_io.h"\n#include "techrib_control.h"\n#include "techrib_metadata.h"\n\nvoid app_main(void)\n{\n    /* Inicialização de I/O e regras inferidas da topologia do projeto TechRib. */\n    techrib_io_init();\n    techrib_control_init();\n\n    while (1) {\n        techrib_control_step();\n        vTaskDelay(pdMS_TO_TICKS(20));\n    }\n}\n';}
  function buildReadme(s,unsupported){
    const io=s.pins.map(p=>`| ${p.pin} | GPIO${p.number} | ${p.mode} | ${p.connections.join('<br>')||p.reason||'-'} |`).join('\n');
    const warn=unsupported.length?`\n## Atenção — regras não automatizadas\n\n${unsupported.map(u=>`- Regra ${u.index+1}: ${u.reason}`).join('\n')}\n`:'';
    return `# ${s.projectName}\n\nProjeto ESP-IDF gerado automaticamente pelo **Simulador TechRib**.\n\n© 2026 TechRib. Todos os direitos reservados sobre os trechos gerados pelo TechRib. As APIs do ESP-IDF permanecem sob suas licenças próprias.\n\n## Perfil de geração\n\n- Generator: TR-CODEGEN-20C\n- Controlador: ${s.controller}\n- IDF target: \`${s.target}\`\n- Faixa declarada no manifesto: ESP-IDF >=5.5,<7.0\n- Build system: CMake padrão do ESP-IDF (project.cmake)\n\n## Compilar\n\nCom o ambiente ESP-IDF ativado:\n\n\`\`\`bash\nidf.py set-target ${s.target}\nidf.py build\nidf.py flash monitor\n\`\`\`\n\nNo Windows/PowerShell, os mesmos comandos podem ser executados após abrir o **ESP-IDF PowerShell/Command Prompt**.\n\n## Mapa de I/O gerado\n\n| Borne TechRib | GPIO físico | Modo | Rede/dispositivo |\n|---|---:|---|---|\n${io||'| - | - | - | Nenhum GPIO conectado |'}\n${warn}\n## Estrutura\n\n- \`CMakeLists.txt\`: projeto ESP-IDF.\n- \`main/app_main.c\`: entrada da aplicação.\n- \`main/techrib_io.*\`: configuração e acesso aos GPIOs.\n- \`main/techrib_control.*\`: lógica gerada das regras do simulador.\n- \`main/techrib_generated.h\`: mapa de GPIO e metadados do gerador.\n- \`main/techrib_metadata.*\`: identificação de procedência TechRib.\n- \`main/idf_component.yml\`: compatibilidade ESP-IDF.\n- \`techrib-project.json\`: manifesto do projeto gerado.\n\n> O TechRib valida topologia/GPIO antes da exportação. A compilação final deve ser executada com o toolchain ESP-IDF instalado no computador do usuário.\n`;
  }
  function buildProject(input={}){
    const s=projectSnapshot(input),control=buildControlSource(s);
    const topCmake=commentHeader('#','CMakeLists.txt')+'cmake_minimum_required(VERSION 3.22)\ninclude($ENV{IDF_PATH}/tools/cmake/project.cmake)\nproject('+s.projectName+')\n';
    const mainCmake=commentHeader('#','main/CMakeLists.txt')+'idf_component_register(\n    SRCS\n        "app_main.c"\n        "techrib_io.c"\n        "techrib_control.c"\n        "techrib_metadata.c"\n    INCLUDE_DIRS "."\n    PRIV_REQUIRES esp_driver_gpio freertos\n)\n';
    const manifest=commentHeader('#','main/idf_component.yml')+'dependencies:\n  idf: ">=5.5,<7.0"\n';
    const sdk=commentHeader('#','sdkconfig.defaults')+'# Defaults intencionalmente mínimos. Ajustes específicos podem ser feitos com idf.py menuconfig.\n';
    const files={
      'CMakeLists.txt':topCmake,
      'sdkconfig.defaults':sdk,
      '.gitignore':'build/\nsdkconfig\nsdkconfig.old\nmanaged_components/\ndependencies.lock\n.vscode/\n',
      'README.md':buildReadme(s,control.unsupported),
      'TECHRIB-GENERATED.txt':`Generated by TechRib Code Generator V2 / Etapa 20C\n© 2026 TechRib. Todos os direitos reservados.\nGenerator ID: TR-CODEGEN-20C\nProject: ${s.projectName}\nTarget: ${s.target}\nGenerated: ${s.generatedAt}\n`,
      'techrib-project.json':JSON.stringify({generator:'TR-CODEGEN-20C',version:VERSION,project:s.projectName,target:s.target,controller:s.controller,profile:s.profileLabel,pins:s.pins,rules:s.rules,generatedAt:s.generatedAt},null,2)+'\n',
      'build.sh':`#!/usr/bin/env bash\nset -euo pipefail\nidf.py set-target ${s.target}\nidf.py build\n`,
      'build.ps1':`$ErrorActionPreference = "Stop"\nidf.py set-target ${s.target}\nidf.py build\n`,
      'main/CMakeLists.txt':mainCmake,
      'main/idf_component.yml':manifest,
      'main/app_main.c':buildAppMain(),
      'main/techrib_generated.h':buildGeneratedHeader(s),
      'main/techrib_io.h':buildIoHeader(),
      'main/techrib_io.c':buildIoSource(s),
      'main/techrib_control.h':buildControlHeader(),
      'main/techrib_control.c':control.source,
      'main/techrib_metadata.h':buildMetadataHeader(),
      'main/techrib_metadata.c':buildMetadataSource(s)
    };
    const tree=[''+s.projectName+'/',...Object.keys(files).sort().map(f=>'  '+f)].join('\n');
    return{projectName:s.projectName,target:s.target,files,tree,preview:files['main/app_main.c'],unsupportedRules:control.unsupported,snapshot:s};
  }
  let crcTable=null;
  function makeCrcTable(){const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;}
  function crc32(bytes){crcTable=crcTable||makeCrcTable();let c=0xFFFFFFFF;for(let i=0;i<bytes.length;i++)c=crcTable[(c^bytes[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0;}
  const u16=(v)=>new Uint8Array([v&255,(v>>>8)&255]);
  const u32=(v)=>new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]);
  function concat(parts){const len=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(len);let off=0;parts.forEach(p=>{out.set(p,off);off+=p.length});return out;}
  function dosDateTime(date=new Date()){let year=Math.max(1980,date.getFullYear());const time=((date.getHours()&31)<<11)|((date.getMinutes()&63)<<5)|((Math.floor(date.getSeconds()/2))&31);const day=((year-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();return{time,day};}
  function createZipBytes(files,prefix=''){
    const encoder=enc(),entries=[],locals=[],centrals=[];let offset=0;const dt=dosDateTime();
    Object.entries(files).forEach(([rawName,content])=>{
      const name=(prefix?prefix.replace(/\/$/,'')+'/':'')+rawName.replace(/^\/+/,''),nameBytes=encoder.encode(name),data=content instanceof Uint8Array?content:encoder.encode(String(content)),crc=crc32(data),flags=0x0800;
      const local=concat([u32(0x04034b50),u16(20),u16(flags),u16(0),u16(dt.time),u16(dt.day),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),nameBytes,data]);
      const central=concat([u32(0x02014b50),u16(20),u16(20),u16(flags),u16(0),u16(dt.time),u16(dt.day),u32(crc),u32(data.length),u32(data.length),u16(nameBytes.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBytes]);
      locals.push(local);centrals.push(central);entries.push(name);offset+=local.length;
    });
    const centralData=concat(centrals),localData=concat(locals),eocd=concat([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralData.length),u32(localData.length),u16(0)]);
    return concat([localData,centralData,eocd]);
  }
  function createZipBlob(project){const bytes=createZipBytes(project.files,project.projectName);if(typeof Blob==='undefined')return bytes;return new Blob([bytes],{type:'application/zip'});}
  return{version:VERSION,buildProject,createZipBytes,createZipBlob,cleanName,cIdent};
});
