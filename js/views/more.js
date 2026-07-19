import { icon } from '../icons.js';

const GROUPS = [
  { title: 'Acompanhamento', items: [
    { p: '/peso',        i: 'scale',  t: 'Peso',           s: 'Registro e gráfico' },
    { p: '/fotos',       i: 'grid',   t: 'Evolução por Fotos', s: 'Linha do tempo e comparação' },
    { p: '/medidas',     i: 'ruler',  t: 'Medidas',        s: '9 medidas corporais' },
    { p: '/agua',        i: 'drop',   t: 'Água',           s: 'Meta diária' },
    { p: '/alimentacao', i: 'meal',   t: 'Alimentação',    s: '6 refeições do dia' }
  ]},
  { title: 'Bem-estar', items: [
    { p: '/sono',   i: 'moon',  t: 'Sono',           s: 'Horas e qualidade' },
    { p: '/humor',  i: 'smile', t: 'Humor',          s: 'Como você está hoje' },
    { p: '/joelho', i: 'knee',  t: 'Dor no joelho',  s: 'Escala 0 a 10' },
    { p: '/diario', i: 'pen',   t: 'Diário',         s: 'Suas anotações' }
  ]},
  { title: 'Conteúdo', items: [
    { p: '/biblioteca',   i: 'grid',    t: 'Biblioteca de Exercícios', s: '30 movimentos ilustrados' },
    { p: '/alongamentos', i: 'stretch', t: 'Biblioteca de Alongamentos', s: '7 alongamentos com passo a passo' }
  ]},
  { title: 'Aplicativo', items: [
    { p: '/config', i: 'gear', t: 'Configurações', s: 'Metas, tema, backup' }
  ]}
];

export default {
  title: 'Mais',
  subtitle: 'Todos os módulos',
  render() {
    return GROUPS.map(g => `
      <div class="section-header"><span class="section-title">${g.title}</span></div>
      <div class="list">
        ${g.items.map(it => `
          <a class="row" href="#${it.p}">
            <div class="row-icon">${icon(it.i, 18)}</div>
            <div class="row-body">
              <div class="row-title">${it.t}</div>
              <div class="row-sub">${it.s}</div>
            </div>
            <span class="row-chevron">${icon('chevron', 15)}</span>
          </a>`).join('')}
      </div>`).join('');
  }
};
