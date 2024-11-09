import { getConsulAPI } from './get-consul-api';

export const registerCyclic = async () => {
  const api = await getConsulAPI();
  return api.register.cyclic;
};
