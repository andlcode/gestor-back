const prisma = require('../prisma');

const EMPTY_EVENT = {
  nome: '',
  nomeExibicao: '',
  nomeCompleto: '',
  ano: '',
  tema: '',
  dataInicio: '',
  dataFim: '',
  localNome: '',
  localEndereco: '',
  valorTrabalhador: '',
  valorConfraternista: '',
  valorPequenoCompanheiro: '',
  valorCamisaAlgodao: '',
  valorCamisaPoliester: '',
  camisaImagens: [],
  camisaImagemUrl: '',
  ativo: true,
  isNew: true,
};

const formatEvento = (evento) => {
  if (!evento) {
    return { ...EMPTY_EVENT };
  }

  const camisaImagens = Array.isArray(evento.camisaImagens)
    ? evento.camisaImagens.map((u) => String(u || '').trim()).filter(Boolean)
    : [];

  return {
    nome: evento.nome || '',
    nomeExibicao: evento.nomeExibicao || '',
    nomeCompleto: evento.nomeCompleto || '',
    tema: evento.tema || '',
    ano: evento.ano != null ? String(evento.ano) : '',
    dataInicio: evento.dataInicio ? evento.dataInicio.toISOString().slice(0, 10) : '',
    dataFim: evento.dataFim ? evento.dataFim.toISOString().slice(0, 10) : '',
    localNome: evento.localNome || '',
    localEndereco: evento.localEndereco || '',
    valorTrabalhador:
      evento.valorTrabalhador != null ? String(evento.valorTrabalhador) : '',
    valorConfraternista:
      evento.valorConfraternista != null ? String(evento.valorConfraternista) : '',
    valorPequenoCompanheiro:
      evento.valorPequenoCompanheiro != null
        ? String(evento.valorPequenoCompanheiro)
        : '',
    valorCamisaAlgodao:
      evento.valorCamisaAlgodao != null ? String(evento.valorCamisaAlgodao) : '',
    valorCamisaPoliester:
      evento.valorCamisaPoliester != null ? String(evento.valorCamisaPoliester) : '',
    camisaImagens,
    camisaImagemUrl: camisaImagens[0] || '',
    ativo: Boolean(evento.ativo),
    isNew: false,
  };
};

const parseRequiredString = (value) => String(value || '').trim();

const parseOptionalString = (value) => {
  const normalized = String(value || '').trim();
  return normalized || null;
};

const parseNumberField = (value) => {
  if (value === '' || value == null) {
    return null;
  }

  const normalized = Number(String(value).replace(',', '.'));
  return Number.isFinite(normalized) ? normalized : NaN;
};

const FALLBACK_CAMISA_ALGODAO = 50;
const FALLBACK_CAMISA_POLIESTER = 35;

/** Corpo vazio: mantém valor atual do evento; se não houver, usa fallback. */
const resolveOptionalMoneyField = (rawBody, existingValue, fallback) => {
  if (rawBody === '' || rawBody == null || rawBody === undefined) {
    if (existingValue != null && Number.isFinite(Number(existingValue))) {
      return Number(existingValue);
    }
    return fallback;
  }
  const n = Number(String(rawBody).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

const parseDateField = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const MAX_CAMISA_IMAGENS = 40;

const parseCamisaImagens = (value) => {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .slice(0, MAX_CAMISA_IMAGENS);
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_CAMISA_IMAGENS);
  }
  return [];
};

/**
 * Monta itens `{ url, legenda }` a partir de `camisaImagens` (TEXT[]).
 * Cada entrada pode ser URL simples ou JSON: `{"url":"https://...","legenda":"..."}`.
 */
const buildCamisasImagensFromCamisaImagens = (camisaImagens) => {
  const arr = Array.isArray(camisaImagens) ? camisaImagens : [];
  const seen = new Set();
  const out = [];

  for (const raw of arr) {
    const s = String(raw || '').trim();
    if (!s) continue;

    if (s.startsWith('{')) {
      try {
        const o = JSON.parse(s);
        const url = String(o.url || o.href || '').trim();
        if (!url || seen.has(url)) continue;
        seen.add(url);
        out.push({
          url,
          legenda: String(o.legenda || o.caption || '').trim(),
        });
        continue;
      } catch {
        // segue como URL literal
      }
    }

    if (seen.has(s)) continue;
    seen.add(s);
    out.push({ url: s, legenda: '' });
  }

  return out;
};

/** Lista pública de URLs do modelo da camisa do evento ativo (galeria; ordem preservada). */
const getEventoPublicCamisa = async (req, res) => {
  try {
    const eventoAtivo = await prisma.evento.findFirst({
      where: { ativo: true },
      orderBy: { updatedAt: 'desc' },
      select: { camisaImagens: true },
    });

    const camisasImagens = buildCamisasImagensFromCamisaImagens(eventoAtivo?.camisaImagens);
    const camisaImagens = camisasImagens.map((x) => x.url);
    const camisaImagemUrl = camisaImagens[0] || '';

    return res.status(200).json({
      success: true,
      data: {
        camisasImagens,
        camisaImagens,
        camisaImagemUrl,
      },
    });
  } catch (error) {
    console.error('[evento] erro ao buscar camisaImagens públicas:', {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados do evento.',
    });
  }
};

const getEvento = async (req, res) => {
  try {
    console.log('[evento] buscando evento ativo', {
      userId: req.userId || null,
      method: req.method,
      path: req.originalUrl,
    });

    const eventoAtivo = await prisma.evento.findFirst({
      where: { ativo: true },
      orderBy: { updatedAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: formatEvento(eventoAtivo),
    });
  } catch (error) {
    console.error('[evento] erro ao buscar evento ativo:', {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar evento.',
    });
  }
};

const updateEvento = async (req, res) => {
  try {
    console.log('[evento] atualizando evento ativo', {
      userId: req.userId || null,
      method: req.method,
      path: req.originalUrl,
      body: req.body,
    });

    const nome = parseRequiredString(req.body?.nome);
    const ano = parseRequiredString(req.body?.ano);
    const dataInicio = parseDateField(req.body?.dataInicio);
    const localNome = parseRequiredString(req.body?.localNome);

    if (!nome || !ano || !dataInicio || !localNome) {
      return res.status(400).json({
        success: false,
        error: 'nome, ano, dataInicio e localNome são obrigatórios.',
      });
    }

    const anoNumero = Number(ano);

    if (!Number.isInteger(anoNumero)) {
      return res.status(400).json({
        success: false,
        error: 'ano deve ser um número inteiro válido.',
      });
    }

    const dataFim = parseDateField(req.body?.dataFim);
    const valorTrabalhador = parseNumberField(req.body?.valorTrabalhador);
    const valorConfraternista = parseNumberField(req.body?.valorConfraternista);
    const valorPequenoCompanheiro = parseNumberField(req.body?.valorPequenoCompanheiro);

    if (
      Number.isNaN(valorTrabalhador) ||
      Number.isNaN(valorConfraternista) ||
      Number.isNaN(valorPequenoCompanheiro)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Os valores informados devem ser numéricos.',
      });
    }

    const eventoAtivoAtual = await prisma.evento.findFirst({
      where: { ativo: true },
      orderBy: { updatedAt: 'desc' },
      select: { valorCamisaAlgodao: true, valorCamisaPoliester: true },
    });

    const valorCamisaAlgodao = resolveOptionalMoneyField(
      req.body?.valorCamisaAlgodao,
      eventoAtivoAtual?.valorCamisaAlgodao,
      FALLBACK_CAMISA_ALGODAO
    );
    const valorCamisaPoliester = resolveOptionalMoneyField(
      req.body?.valorCamisaPoliester,
      eventoAtivoAtual?.valorCamisaPoliester,
      FALLBACK_CAMISA_POLIESTER
    );

    if (Number.isNaN(valorCamisaAlgodao) || Number.isNaN(valorCamisaPoliester)) {
      return res.status(400).json({
        success: false,
        error: 'Os valores de camisa informados devem ser numéricos.',
      });
    }

    if (valorCamisaAlgodao < 0 || valorCamisaPoliester < 0) {
      return res.status(400).json({
        success: false,
        error: 'Os valores de camisa não podem ser negativos.',
      });
    }

    const payload = {
      nome,
      nomeExibicao: parseOptionalString(req.body?.nomeExibicao),
      nomeCompleto: parseOptionalString(req.body?.nomeCompleto),
      tema: parseOptionalString(req.body?.tema),
      ano: anoNumero,
      dataInicio,
      dataFim,
      localNome,
      localEndereco: parseOptionalString(req.body?.localEndereco),
      valorTrabalhador,
      valorConfraternista,
      valorPequenoCompanheiro,
      valorCamisaAlgodao,
      valorCamisaPoliester,
      camisaImagens: parseCamisaImagens(req.body?.camisaImagens),
      ativo: true,
    };
    
    const updatedEvento = await prisma.$transaction(async (tx) => {
      const eventoAtivo = await tx.evento.findFirst({
        where: { ativo: true },
        orderBy: { updatedAt: 'desc' },
      });

      await tx.evento.updateMany({
        where: { ativo: true },
        data: { ativo: false },
      });

      if (eventoAtivo) {
        return tx.evento.update({
          where: { id: eventoAtivo.id },
          data: payload,
        });
      }

      return tx.evento.create({
        data: payload,
      });
    });

    return res.status(200).json({
      success: true,
      data: formatEvento(updatedEvento),
      message: 'Evento atualizado com sucesso.',
    });
  } catch (error) {
    console.error('[evento] erro ao atualizar evento ativo:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });

    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar evento.',
    });
  }
};

module.exports = {
  getEvento,
  getEventoPublicCamisa,
  updateEvento,
};
