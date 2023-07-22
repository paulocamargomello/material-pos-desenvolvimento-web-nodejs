import { v4 as uuidv4 } from 'uuid';
import util from 'util';
import sequelizeLib, { Model } from 'sequelize';

import { AutenticacaoInvalida, DadosOuEstadoInvalido } from '../shared/erros';
import knex from '../shared/querybuilder';

const pausar = util.promisify(setTimeout);

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Senha = string;
export type Login = string;

export type Usuario = {
  nome: string;
  login: Login;
  senha: Senha;
  admin: boolean; // poderia ser também um enum, por exemplo: tipo: 'admin' | 'usuario'
}

type Autenticacao = {
  id_usuario: number;
  id: IdAutenticacao;
}

declare module 'knex/types/tables' {
  interface Tables {
    usuarios: Usuario;
    autenticacoes: Autenticacao;
  }
}

const autenticacoes: { [key: IdAutenticacao]: Usuario } = {};

export async function autenticar (login: Login, senha: Senha): Promise<IdAutenticacao> {
  const usuario = await knex('usuarios')
    .select('login', 'senha', 'nome', 'admin')
    .where({ login })
    .first();
  if (usuario === undefined || usuario.senha !== senha) {
    throw new DadosOuEstadoInvalido('Login ou senha inválidos', {
      codigo: 'CREDENCIAIS_INVALIDAS'
    });
  }
  const id = gerarId();
  autenticacoes[id] = usuario;
  return id;
}

export async function recuperarUsuarioAutenticado (token: IdAutenticacao): Promise<Usuario> {
  const usuario = await knex('autenticacoes')
    .join('usuarios', 'usuarios.id', 'autenticacoes.id_usuario')
    .select<Usuario>('login', 'senha', 'nome', 'admin')
    .where('autenticacoes.id', token)
    .first();
  if (usuario === undefined) {
    throw new AutenticacaoInvalida();
  }
  return usuario;
}

export async function alterarNome (usuario: Usuario, novoNome: string): Promise<void> {
  await pausar(25);
  usuario.nome = novoNome; // isso funciona pois a referência é a mesma!
  // em um cenário real, teríamos uma chamada SQL aqui
}

function gerarId (): IdAutenticacao {
  return uuidv4();
}
