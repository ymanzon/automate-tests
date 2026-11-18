const removeAccents = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const clean = (v) => removeAccents(v.trim().toUpperCase());
