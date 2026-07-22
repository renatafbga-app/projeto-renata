/* ============================================================================
 * DATAS — fonte única e correta para a data de trabalho do aplicativo.
 *
 * BUG CORRIGIDO (v1.6.0): usávamos `new Date().toISOString().slice(0,10)`,
 * que converte para UTC antes de cortar. No Brasil (UTC−3), das 21h à
 * meia-noite o UTC já está no dia seguinte — então o app "virava o dia" às 21h.
 *
 * Aqui tudo é calculado no HORÁRIO LOCAL do aparelho. O dia só muda à
 * meia-noite local, nunca antes.
 *
 * "Data de trabalho": além de hoje, o app permite navegar para qualquer data.
 * A data selecionada vive aqui e é observável — quando muda, todos os módulos
 * passam a ler e gravar naquela data.
 * ========================================================================== */
import { LS_PREFIX } from './schema.js';

/** Data local no formato AAAA-MM-DD, sem passar por UTC. */
export function localISO(d = new Date()) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Hoje, no fuso do aparelho. */
export const hojeISO = () => localISO(new Date());

/** Converte "AAAA-MM-DD" em Date ao MEIO-DIA local (evita saltos de fuso). */
export function paraData(iso) {
  const [a, m, d] = String(iso).split('-').map(Number);
  return new Date(a, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

/** Soma dias a uma data ISO, no calendário local. */
export function somarDias(iso, n) {
  const d = paraData(iso);
  d.setDate(d.getDate() + n);
  return localISO(d);
}

/** Diferença em dias inteiros entre duas datas ISO. */
export function diffDias(a, b) {
  return Math.round((paraData(b) - paraData(a)) / 86400000);
}

export const ehHoje    = iso => iso === hojeISO();
export const ehFuturo  = iso => diffDias(hojeISO(), iso) > 0;

/** Rótulo amigável: Hoje, Ontem, Amanhã, ou a data por extenso. */
export function rotuloRelativo(iso) {
  const d = diffDias(hojeISO(), iso);
  if (d === 0)  return 'Hoje';
  if (d === -1) return 'Ontem';
  if (d === 1)  return 'Amanhã';
  if (d === -2) return 'Anteontem';
  return paraData(iso).toLocaleDateString('pt-BR',
    { weekday: 'short', day: '2-digit', month: 'short' });
}

/* ---------------------------------------------------------- data ativa */
const bus = new EventTarget();
let _ativa = hojeISO();

export const dataAtiva = () => _ativa;

/** Muda a data de trabalho e avisa toda a aplicação. */
export function definirDataAtiva(iso, { silencioso = false } = {}) {
  const nova = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : hojeISO();
  if (nova === _ativa) return _ativa;
  _ativa = nova;
  if (!silencioso) bus.dispatchEvent(new CustomEvent('change', { detail: _ativa }));
  return _ativa;
}

export const irParaHoje = () => definirDataAtiva(hojeISO());
export const avancarDia = () => definirDataAtiva(somarDias(_ativa, 1));
export const voltarDia  = () => definirDataAtiva(somarDias(_ativa, -1));

/** Escuta mudanças da data ativa; devolve função para cancelar. */
export function aoMudarData(fn, { signal } = {}) {
  bus.addEventListener('change', fn, { signal });
  return () => bus.removeEventListener('change', fn);
}

/**
 * Ao reabrir o app num novo dia, a data ativa acompanha — mas só se estava em
 * "hoje". Se a usuária tinha navegado para outro dia, respeitamos a escolha.
 */
export function sincronizarAoAbrir() {
  const ultimoHoje = localStorage.getItem(LS_PREFIX + 'ui.ultimoHoje');
  const hoje = hojeISO();
  if (ultimoHoje && ultimoHoje !== hoje && _ativa === ultimoHoje) {
    _ativa = hoje;                       // estava em "hoje" ontem → segue para o novo hoje
  }
  try { localStorage.setItem(LS_PREFIX + 'ui.ultimoHoje', hoje); } catch {}
}
