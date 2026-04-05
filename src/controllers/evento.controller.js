const prisma = require('../prisma');

const EMPTY_EVENT = {
  nome: '',
  nomeExibicao: '',
  nomeCompleto: '',
  ano: '',
  dataInicio: '',
  dataFim: '',
  localNome: '',
  localEndereco: '',
  valorTrabalhador: '',
  valorConfraternista: '',
  valorPequenoCompanheiro: '',
  ativo: true,
  isNew: true,
};

const formatEvento = (evento) => {
  if (!evento) {
    return { ...EMPTY_EVENT };
  }

  return {
    nome: evento.nome || '',
    nomeExibicao: evento.nomeExibicao || '',
    nomeCompleto: evento.nomeCompleto || '',
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

const parseDateField = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

    const payload = {
      nome,
      nomeExibicao: parseOptionalString(req.body?.nomeExibicao),
      nomeCompleto: parseOptionalString(req.body?.nomeCompleto),
      ano: anoNumero,
      dataInicio,
      dataFim,
      localNome,
      localEndereco: parseOptionalString(req.body?.localEndereco),
      valorTrabalhador,
      valorConfraternista,
      valorPequenoCompanheiro,
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
  updateEvento,
};
