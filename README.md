Sistema de Gerenciamento de Acessos
Este é um sistema completo para gerenciamento de acessos de colaboradores a softwares, construído com uma arquitetura moderna usando React, Node.js, MariaDB e Docker.

🚀 Começando
Este guia irá ajudá-lo a configurar e executar o ambiente de desenvolvimento completo na sua máquina.

Pré-requisitos
Docker e Docker Compose: Certifique-se de que ambos estão instalados no seu sistema.

Git: Para clonar o repositório.

Banco de Dados MariaDB: Uma instância do MariaDB (versão 10 ou superior) rodando e acessível a partir da sua máquina de desenvolvimento.

⚙️ Estrutura do Projeto
O projeto está organizado em uma arquitetura de microsserviços com duas pastas principais:

gestao-de-acessos/
├── backend/         # Contém o servidor Node.js (API)
├── frontend/        # Contém a aplicação React (Interface do Usuário)
└── docker-compose.yml # Orquestra todos os serviços

🛠️ Instalação e Configuração
Siga estes passos para colocar tudo para funcionar.

Clone o Repositório:

git clone https://github.com/seu-usuario/gestao-de-acessos.git
cd gestao-de-acessos

Configure as Variáveis de Ambiente:
Antes de iniciar, é crucial configurar a conexão com o seu banco de dados. Abra o arquivo docker-compose.yml e edite a seção environment do serviço backend com as suas credenciais:

# ... (dentro de docker-compose.yml)
services:
  # ...
  backend:
    # ...
    environment:
      # --- IMPORTANTE: PREENCHA ESTES VALORES ---
      # Se o banco de dados está rodando na sua máquina (fora do Docker), use 'host.docker.internal'
      # Se estiver em outro servidor na rede, use o IP ou hostname desse servidor.
      - DB_HOST=host.docker.internal
      - DB_USER=seu_usuario_do_banco
      - DB_PASSWORD=sua_senha_do_banco
      - DB_NAME=gestao_acessos
      - DB_PORT=3306

Inicie a Aplicação:
Após configurar as variáveis de ambiente, execute o seguinte comando na raiz do projeto para construir as imagens e iniciar os contêineres:

docker compose up --build -d

A flag -d executa os contêineres em segundo plano.

✅ Acesso à Aplicação
Frontend: A aplicação estará disponível em http://localhost:3000.

Backend: A API estará escutando em http://localhost:4000.

Para parar todos os serviços, execute: docker compose down.
