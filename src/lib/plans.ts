export const WHATSAPP_NUMBER = '5567998135116';
export const whatsappLink = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const COMMON = ['Organização financeira', 'Gestão de despesas fixas', 'Assistente financeiro com IA', 'Registro por voz, conforme disponibilidade', 'Gráficos e relatórios', 'Metas financeiras', 'Acompanhamento da evolução'];

export const PLANS = [
  { id: 'monthly', name: 'Plano mensal', price: 'R$ 6,27', suffix: '/mês', tagline: '', highlight: false, cta: 'QUERO O PLANO MENSAL',
    items: ['Acesso ao PATRION', 'Controle de receitas e despesas', ...COMMON],
    message: 'Olá! Tenho interesse em assinar o PATRION pelo plano mensal de R$ 6,27. Gostaria de receber mais informações sobre o acesso e a ativação.' },
  { id: 'lifetime', name: 'Plano vitalício', price: 'R$ 57,42', suffix: 'pagamento único', tagline: 'Pague uma vez e tenha acesso vitalício ao PATRION.', highlight: true, cta: 'QUERO MEU ACESSO VITALÍCIO',
    items: ['Acesso vitalício ao aplicativo', ...COMMON],
    message: 'Olá! Tenho interesse em adquirir o acesso vitalício ao PATRION por R$ 57,42, com pagamento único. Gostaria de saber como funciona a contratação e ativação.' },
] as const;
