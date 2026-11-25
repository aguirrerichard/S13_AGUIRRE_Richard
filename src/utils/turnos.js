// Turnos del personal (hora de Lima): mañana 06-14, tarde 14-22, noche 22-06
export function turnoActual(fecha = new Date()) {
  const hora = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Lima' }).format(fecha)) % 24;
  if (hora >= 6 && hora < 14) return 'manana';
  if (hora >= 14 && hora < 22) return 'tarde';
  return 'noche';
}

// Acepta "Mañana", "manana", "tarde", "Noche", "1", "2", "3"... y devuelve manana | tarde | noche
export function normalizarTurno(valor) {
  if (!valor) return 'manana';
  const t = String(valor).toLowerCase().trim();
  if (t.includes('tard') || t === '2') return 'tarde';
  if (t.includes('noc') || t === '3') return 'noche';
  return 'manana';
}
