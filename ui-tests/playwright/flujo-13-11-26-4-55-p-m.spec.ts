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
  {"nombres":"Maria Fernanda","apellidos":"Pérez López","correo":"maria.fernanda.perez@transporte.mrptechnology.mx","telefono":"5511123456","usuario":"mfperroz"},
  {"nombres":"Luis Fernando","apellidos":"Gómez García","correo":"luis.fernando.gomez@transporte.mrptechnology.mx","telefono":"5522334455","usuario":"lfgomez"},
  {"nombres":"Gabriela Sofía","apellidos":"Torres Martínez","correo":"gabriela.sofia.torres@transporte.mrptechnology.mx","telefono":"5533445566","usuario":"gstorres"},
  {"nombres":"Diego Antonio","apellidos":"Sánchez Rivera","correo":"diego.antonio.sanchez@transporte.mrptechnology.mx","telefono":"5544556677","usuario":"dasanchez"},
  {"nombres":"Carla Belén","apellidos":"Rodríguez Díaz","correo":"carla.belen.rodriguez@transporte.mrptechnology.mx","telefono":"5555667788","usuario":"cbrodriguez"},
];

for (const [i, rowVars] of rows.entries()) {
  test("Flujo 13/11/26, 4:55 p.m." + ` · fila ${i + 1}`, async ({ page }) => {
    const vars: Record<string, any> = { ...rowVars, row: i + 1, rows: rows.length, seed: 0 };
    await page.goto("https://recaudo-qroo-dev.transporte.mrptechnology.mx/login");
    await page.locator("input[name=\"username\"]").first().fill("superadmin");
    await page.locator("input[name=\"username\"]").first().press("Tab");
    await page.locator("input[name=\"password\"]").first().fill("superadmin");
    await page.locator("input[name=\"password\"]").first().press("Tab");
    await page.locator("#root > div:nth-of-type(1) > div > div > div:nth-of-type(2) > div > form > div > div:nth-of-type(1) > div:nth-of-type(4) > a").first().press("Tab");
    await page.locator("#root > div:nth-of-type(1) > div > div > div:nth-of-type(2) > div > form > div > div:nth-of-type(1) > div:nth-of-type(5) > button").first().click();
    await page.waitForURL(new RegExp("https://recaudo-qroo-dev\\.transporte\\.mrptechnology\\.mx/"));
    await page.locator("#root > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > ul > li:nth-of-type(9) > div").first().click();
    await page.locator("#root > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > ul > div:nth-of-type(9) > div > div > ul > a:nth-of-type(1) > li > div").first().click();
    await page.waitForURL(new RegExp("/seguridad/usuarios"));
    await page.locator("#root > div.transporte-dashboard > div.content > div.transporte-elementos > div > div > header > div > button:nth-child(2)").first().click();
    await page.locator("input[name=\"nombres\"]").first().fill(`${lib.str(vars.nombres)}`);
    await page.locator("input[name=\"nombres\"]").first().press("Tab");
    await page.locator("input[name=\"apellidos\"]").first().fill(`${lib.str(vars.apellidos)}`);
    await page.locator("input[name=\"apellidos\"]").first().press("Tab");
    await page.locator("body > div:nth-of-type(2) > div:nth-of-type(3) > div > form > div:nth-of-type(1) > div > div:nth-of-type(4) > div > div > input").first().fill(`${lib.str(vars.correo)}`);
    await page.locator("body > div:nth-of-type(2) > div:nth-of-type(3) > div > form > div:nth-of-type(1) > div > div:nth-of-type(4) > div > div > input").first().press("Tab");
    await page.locator("input[name=\"telefono\"]").first().fill(`${lib.str(vars.telefono)}`);
    await page.locator("input[name=\"telefono\"]").first().press("Tab");
    await page.locator("body > div:nth-of-type(2) > div:nth-of-type(3) > div > form > div:nth-of-type(1) > div > div:nth-of-type(8) > div > div > input").first().fill(`${lib.str(vars.usuario)}`);
    await page.locator("body > div:nth-of-type(2) > div:nth-of-type(3) > div > form > div:nth-of-type(1) > div > div:nth-of-type(8) > div > div > input").first().press("Tab");
    await page.locator("input[name=\"password\"]").first().fill("Qw1!1234");
    await page.locator("input[name=\"password\"]").first().press("Tab");
    await page.locator("body > div:nth-of-type(2) > div:nth-of-type(3) > div > form > div:nth-of-type(1) > div > div:nth-of-type(10) > div > div > div").first().press("ArrowDown");
    await page.locator("#menu-idPerfil > div:nth-of-type(3) > ul > li:nth-of-type(1)").first().press("ArrowDown");
    await page.locator("#menu-idPerfil > div:nth-of-type(3) > ul > li:nth-of-type(2)").first().press("ArrowDown");
    await page.locator("#menu-idPerfil > div:nth-of-type(3) > ul > li:nth-of-type(3)").first().press("Enter");
    await page.locator("text='Crear'").first().click();
    await page.waitForTimeout(1500);
    await page.locator("#root > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > button").first().click();
    await page.waitForURL(new RegExp("/login"));
  });
}
