Sistema de Gestão de Acessos
Este é um sistema completo para gestão de acessos de colaboradores a softwares, construído com uma arquitetura moderna usando React, Node.js, MariaDB e Docker.

🚀 Começando
Este guia irá ajudá-lo a configurar e executar o ambiente de desenvolvimento completo na sua máquina.

Pré-requisitos
Docker e Docker Compose: Certifique-se de que ambos estão instalados no seu sistema.

Git: Para clonar o repositório.

Base de Dados MariaDB: Uma instância do MariaDB (versão 10 ou superior) a rodar e acessível a partir da sua máquina de desenvolvimento.

⚙️ Estrutura do Projeto
O projeto está organizado numa arquitetura de microserviços com duas pastas principais:

gestao-de-acessos/
├── backend/         # Contém o servidor Node.js (API)
├── frontend/        # Contém a aplicação React (Interface do Utilizador)
└── docker-compose.yml # Orquestra todos os serviços

🛠️ Instalação e Configuração
Siga estes passos para colocar tudo a funcionar.

Clone o Repositório:

git clone https://github.com/seu-usuario/gestao-de-acessos.git
cd gestao-de-acessos

Configure as Variáveis de Ambiente:
Antes de iniciar, é crucial configurar a conexão com a sua base de dados. Abra o ficheiro docker-compose.yml e edite a secção environment do serviço backend com as suas credenciais:

# ... (dentro de docker-compose.yml)
services:
  # ...
  backend:
    # ...
    environment:
      # --- IMPORTANTE: PREENCHA ESTES VALORES ---
      # Se o banco de dados está a rodar na sua máquina (fora do Docker), use 'host.docker.internal'
      # Se estiver noutro servidor na rede, use o IP ou hostname desse servidor.
      - DB_HOST=host.docker.internal
      - DB_USER=seu_usuario_do_banco
      - DB_PASSWORD=sua_senha_do_banco
      - DB_NAME=gestao_acessos
      - DB_PORT=3306
