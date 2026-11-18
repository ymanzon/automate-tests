const generateCURPBase = (name, paternal, maternal, birthDate, sex, state) => {
    //const clean1 = (v) => removeAccents(v.trim().toUpperCase());
    const p = clean(paternal);
    const m = clean(maternal);
    const n = clean(name);
    const date = new Date(birthDate);
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const internal = (v) => v.slice(1).match(/[BCDFGHJKLMNPQRSTVWXYZ]/)?.[0] || "X";
    return `${p[0] || "X"}${p.slice(1).match(/[AEIOU]/)?.[0] || "X"}${m[0] || "X"}${n[0] || "X"}${year}${month}${day}${sex.toUpperCase()}${state.toUpperCase()}${internal(p)}${internal(m)}${internal(n)}`;
};
