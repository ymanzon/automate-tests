const generateRFCBase = (name, paternal, maternal, birthDate) => {
    //const clean = (v) => removeAccents(v.trim().toUpperCase());
    const n = clean(name);
    const p = clean(paternal);
    const m = clean(maternal);
    const date = new Date(birthDate);
    const vowel = p.slice(1).match(/[AEIOU]/)?.[0] || "X";
    const first = p[0] || "X";
    const second = m[0] || "X";
    const third = n[0] || "X";
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${first}${vowel}${second}${third}${year}${month}${day}`;
};
