/** Namenspool für zufällig generierte Fahrer */
export const DRIVER_NAMES = [
  "Klaus Bergmann", "Sabine Krüger", "Murat Yilmaz", "Petra Lindner",
  "Jörg Steinbach", "Anna Kowalski", "Hans Ottmann", "Fatma Demir",
  "Rainer Vogt", "Melanie Busch", "Tomasz Nowak", "Ingrid Sommer",
  "Dieter Falk", "Elena Petrova", "Stefan Brandt", "Gül Aydin",
  "Werner Haas", "Katrin Ebert", "Milan Kovac", "Birgit Lorenz",
];

export const randomDriverName = () =>
  DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)];
