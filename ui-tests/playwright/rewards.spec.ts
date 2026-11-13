import { test, expect } from '@playwright/test';

// Funciones integradas ({random(1,9)}, {date("+7d")}, {upper(x)}…) y operadores: mismo código que usa la extensión.
const lib = (function makeLib(R) {
    const NUM = /^-?(0|[1-9]\d*)(\.\d+)?$/;
    const isNum = (v) => (typeof v === 'number' && isFinite(v)) || (typeof v === 'string' && NUM.test(v.trim()));
    const str = (v) => {
      if (v == null) return '';
      if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(parseFloat(v.toPrecision(12)));
      return typeof v === 'object' ? JSON.stringify(v) : String(v);
    };
    const num = (v) => {
      if (!isNum(v)) throw new Error('"' + str(v) + '" no es un número');
      return Number(v);
    };
    const truthy = (v) => !(v == null || v === false || v === 0 || v === '' || v === '0' || v === 'false');
    const pad2 = (n) => String(n).padStart(2, '0');
    const intIn = (a, b) => { a = Math.ceil(num(a)); b = Math.floor(num(b)); if (b < a) throw new Error('random(min, max): min es mayor que max'); return a + Math.floor(R() * (b - a + 1)); };
    const hex = () => Math.floor(R() * 16).toString(16);
    const L = {
      // operadores
      add: (a, b) => (isNum(a) && isNum(b) ? Number(a) + Number(b) : str(a) + str(b)),
      sub: (a, b) => num(a) - num(b),
      mul: (a, b) => num(a) * num(b),
      div: (a, b) => { if (num(b) === 0) throw new Error('división entre cero'); return num(a) / num(b); },
      mod: (a, b) => { if (num(b) === 0) throw new Error('división entre cero'); return num(a) % num(b); },
      eq: (a, b) => (isNum(a) && isNum(b) ? Number(a) === Number(b) : str(a) === str(b)),
      ne: (a, b) => !L.eq(a, b),
      lt: (a, b) => (isNum(a) && isNum(b) ? Number(a) < Number(b) : str(a) < str(b)),
      le: (a, b) => (isNum(a) && isNum(b) ? Number(a) <= Number(b) : str(a) <= str(b)),
      gt: (a, b) => (isNum(a) && isNum(b) ? Number(a) > Number(b) : str(a) > str(b)),
      ge: (a, b) => (isNum(a) && isNum(b) ? Number(a) >= Number(b) : str(a) >= str(b)),
      truthy, num, str,
      and: async (a, b) => { const x = await a(); return truthy(x) ? b() : x; },
      or: async (a, b) => { const x = await a(); return truthy(x) ? x : b(); },
      // aleatorios
      random: (...a) => {
        if (a.length === 0) return R();
        if (a.length === 2) return intIn(a[0], a[1]);
        throw new Error('random() recibe 0 o 2 argumentos: random() o random(min, max)');
      },
      pick: (...a) => { const l = a.length === 1 && Array.isArray(a[0]) ? a[0] : a; if (!l.length) throw new Error('pick() necesita al menos un valor'); return l[Math.floor(R() * l.length)]; },
      uuid: () => { const t = '10000000-1000-4000-8000-100000000000'; return t.replace(/[018]/g, (c) => (c === '1' ? hex() : c === '0' ? hex() : (8 + Math.floor(R() * 4)).toString(16))); },
      // fechas: date("+7d", "yyyy-MM-dd")  ·  unidades: s m h d w M y  ·  now() = milisegundos
      now: () => Date.now(),
      date: (offset, fmt) => {
        const d = new Date();
        if (offset != null && offset !== '') {
          const m = String(offset).trim().match(/^([+-]?\d+)\s*([smhdwMy])$/);
          if (!m) throw new Error('date(): desfase no válido "' + offset + '" (ejemplos: "+7d", "-1M", "+2h")');
          const n = Number(m[1]);
          ({ s: () => d.setSeconds(d.getSeconds() + n), m: () => d.setMinutes(d.getMinutes() + n), h: () => d.setHours(d.getHours() + n), d: () => d.setDate(d.getDate() + n), w: () => d.setDate(d.getDate() + 7 * n), M: () => d.setMonth(d.getMonth() + n), y: () => d.setFullYear(d.getFullYear() + n) })[m[2]]();
        }
        return String(fmt || 'yyyy-MM-dd').replace(/yyyy|MM|dd|HH|mm|ss/g, (t) => ({ yyyy: d.getFullYear(), MM: pad2(d.getMonth() + 1), dd: pad2(d.getDate()), HH: pad2(d.getHours()), mm: pad2(d.getMinutes()), ss: pad2(d.getSeconds()) })[t]);
      },
      age: (birth) => {
        const b = new Date(String(birth)), n = new Date();
        if (isNaN(b)) throw new Error('age(): fecha no válida "' + birth + '" (usa yyyy-MM-dd)');
        let a = n.getFullYear() - b.getFullYear();
        if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
        return a;
      },
      // números
      round: (x, d) => { const k = Math.pow(10, d == null ? 0 : num(d)); return Math.round(num(x) * k) / k; },
      floor: (x) => Math.floor(num(x)), ceil: (x) => Math.ceil(num(x)), abs: (x) => Math.abs(num(x)),
      min: (...a) => Math.min(...a.map(num)), max: (...a) => Math.max(...a.map(num)),
      int: (x) => { const n = parseInt(str(x), 10); if (isNaN(n)) throw new Error('int(): "' + str(x) + '" no es un número'); return n; },
      // texto
      upper: (s) => str(s).toUpperCase(), lower: (s) => str(s).toLowerCase(), trim: (s) => str(s).trim(),
      len: (s) => (Array.isArray(s) ? s.length : str(s).length),
      pad: (s, n, ch) => str(s).padStart(num(n), ch == null ? ' ' : str(ch)),
      replace: (s, a, b) => str(s).split(str(a)).join(str(b)),
      slice: (s, a, b) => str(s).slice(num(a), b == null ? undefined : num(b)),
      contains: (s, sub) => str(s).includes(str(sub)),
      split: (s, sep) => str(s).split(str(sep)),
      join: (a, sep) => (Array.isArray(a) ? a : [a]).map(str).join(sep == null ? ',' : str(sep)),
    };
    return L;
  })(Math.random);

// Datos: se ejecuta el test una vez por fila. Edita este arreglo o cárgalo desde tu propio CSV.
const rows: Record<string, string>[] = [
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"la_importancia_de_la_matematica_en_el_mundo_y_el_pensamiento_analitico"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"por_que_la_matematica_es_critica_para_el_desarrollo_cognitivo"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"beneficios_de_estudiar_matematicas_en_educacion_primaera"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"impacta_la_matematica_en_la_economia_global"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"la_matematica_y_el_desarrollo_de_la_logica_crítica"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"la_matematica_es_clave_para_la_innovacion_tecnologica"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"por_que_la_matematica_es_esencial_en_la_bioinformática"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"el_rol_de_la_matematica_en_el_ensayo_cientifico"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"como_la_matematica_fomenta_el_raciomatemático_en_ciencia"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"el_papel_de_la_matematica_en_la_ingenieria_modern"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"la_matematica_y_su_influencia_en_la_decisión_económica"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"por_que_la_matematica_es_instrumento_de_analisis"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"los_valores_matemáticos_en_la_filosofía_del_conocimiento"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"la_matemática_y_la_capacidad_de_resolver_problemas_complejos"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"el_uso_de_la_matemática_en_la_inteligencia_artificial"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"la_matematica_y_el_fomento_del_piñcho_analítico"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"por_que_la_matemática_es_un_aliado_para_el_aprendizaje"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"la_matematica_y_el_desarrollo_de_la_creatividad"},
  {"porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico":"el_importante_de_la_matemática_en_el_desarrollo_humano"},
];

for (const [i, rowVars] of rows.entries()) {
  test("REWARDS" + ` · fila ${i + 1}`, async ({ page }) => {
    const vars: Record<string, any> = { ...rowVars, row: i + 1, rows: rows.length, seed: 0 };
    await page.goto("https://www.bing.com/search?FORM=U523DF&PC=U536&q=&PC=U316&FORM=CHROMN");
    await page.locator("#sb_form_q").first().fill("");
    await page.locator("#sb_form_q").first().pressSequentially(`${lib.str(vars.porque_es_importante_matematicas_en_el_mundo_y_el_pensamiento_analitico)}`, { delay: 50 });
    await page.locator("#sb_form_q").first().press("Enter");
    await page.waitForURL(new RegExp("/search"));
    await page.waitForTimeout(5000);
  });
}
