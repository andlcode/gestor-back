const prisma = require('../prisma');

const REGISTRATION_CLOSED_MESSAGE = 'As inscrições estão encerradas no momento.';

const getActiveEventoRegistrationStatus = async () => {
  const evento = await prisma.evento.findFirst({
    where: { ativo: true },
    orderBy: { updatedAt: 'desc' },
    select: { registrationsOpen: true },
  });

  if (!evento) {
    return { registrationsOpen: false };
  }

  return { registrationsOpen: evento.registrationsOpen === true };
};

const isRegistrationClosed = async () => {
  const { registrationsOpen } = await getActiveEventoRegistrationStatus();
  return !registrationsOpen;
};

module.exports = {
  REGISTRATION_CLOSED_MESSAGE,
  getActiveEventoRegistrationStatus,
  isRegistrationClosed,
};
