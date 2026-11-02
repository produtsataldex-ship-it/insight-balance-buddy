// Maps every assistant failure to a real cause so users never see a false "no internet" message.
export type AssistantErrorKind = 'offline' | 'server' | 'ai_unavailable' | 'auth' | 'rate_limit' | 'credits' | 'timeout' | 'temporary' | 'invalid_response' | 'data';

export const ASSISTANT_ERROR_TEXT: Record<AssistantErrorKind, string> = {
  offline: 'Você está sem internet. Sua mensagem foi mantida para enviar depois.',
  server: 'O servidor do Patrion não respondeu. Tente novamente em instantes.',
  ai_unavailable: 'O serviço de inteligência está indisponível agora. Tente novamente em instantes.',
  auth: 'Sua sessão expirou. Entre novamente para continuar.',
  rate_limit: 'Muitas mensagens em pouco tempo. Aguarde alguns segundos e tente de novo.',
  credits: 'O limite de uso do assistente foi atingido. Avise o administrador.',
  timeout: 'O assistente demorou demais para responder. Tente novamente.',
  temporary: 'Houve uma falha temporária. Tente novamente.',
  invalid_response: 'O assistente respondeu em um formato inesperado. Tente reformular.',
  data: 'Não foi possível consultar seus dados agora. Tente novamente.',
};

/** Server side: classify an AI Gateway error code. */
export function kindFromGatewayCode(code: string | undefined): AssistantErrorKind {
  switch (code) {
    case 'rate_limited': return 'rate_limit';
    case 'payment_required': return 'credits';
    case 'timeout': case 'cancelled': return 'timeout';
    case 'invalid_response': return 'invalid_response';
    case 'authentication_error': case 'permission_denied': case 'configuration_error': return 'ai_unavailable';
    case 'network_error': case 'operation_failed': return 'ai_unavailable';
    default: return 'temporary';
  }
}

/** Client side: classify a thrown error from calling the server function. */
export function kindFromClientError(error: unknown, online: boolean): AssistantErrorKind {
  if (!online) return 'offline';
  const msg = error instanceof Error ? error.message : String(error ?? '');
  const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status: unknown }).status) : NaN;
  if (status === 401 || /unauthori[sz]ed|jwt|session/i.test(msg)) return 'auth';
  if (status === 429) return 'rate_limit';
  if (status === 504 || /timeout|timed out/i.test(msg)) return 'timeout';
  if (status >= 500 || /internal server|bad gateway|service unavailable/i.test(msg)) return 'server';
  if (/failed to fetch|networkerror|load failed/i.test(msg)) return 'server';
  if (/json|unexpected token/i.test(msg)) return 'invalid_response';
  return 'temporary';
}
