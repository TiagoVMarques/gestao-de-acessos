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

🤖 Automação com Scripts
Para facilitar a gestão do ambiente Docker, pode criar os seguintes scripts na raiz do projeto.

1. Script start.sh (Iniciar Tudo)
Este script constrói e inicia todos os contentores em segundo plano.

Crie o ficheiro start.sh e cole:

#!/bin/bash
# Este script constrói e inicia todos os serviços definidos no docker-compose.yml

echo "🚀 Iniciando todos os serviços (Frontend, Backend)..."

# O comando 'docker compose up' com a flag '-d' (detached) inicia os contentores em segundo plano.
# A flag '--build' força a reconstrução das imagens se houver alguma alteração nos Dockerfiles.
docker compose up --build -d

echo "✅ Ambiente iniciado com sucesso!"
echo "-------------------------------------"
echo "Frontend disponível em: http://localhost:3000"
echo "Backend disponível em:  http://localhost:4000"
echo "-------------------------------------"
echo "Para ver os logs, use: docker compose logs -f"
echo "Para parar os serviços, use: ./stop.sh"

2. Script stop.sh (Parar Tudo)
Este script para os contentores que estão a rodar.

Crie o ficheiro stop.sh e cole:

#!/bin/bash
# Este script para todos os serviços que estão a rodar.

echo "🛑 Parando todos os serviços..."

# O comando 'docker compose down' para e remove os contentores e a rede.
docker compose down

echo "✅ Serviços parados."

3. Script clean.sh (Limpeza Total)
Este script para e remove os contentores, as redes e as imagens construídas.

Crie o ficheiro clean.sh e cole:

#!/bin/bash
# Este script faz uma limpeza completa do ambiente.

echo "🧼 Realizando limpeza completa..."

# Para e remove os contentores, a rede e todas as imagens associadas.
docker compose down --rmi all -v

echo "✅ Limpeza concluída."

Como Usar os Scripts
Torne os Scripts Executáveis:
Execute este comando uma única vez no seu terminal para dar permissão de execução aos ficheiros:

chmod +x start.sh stop.sh clean.sh

Execute os Comandos:

Para iniciar o ambiente: ./start.sh

Para parar o ambiente: ./stop.sh

Para uma limpeza completa: ./clean.sh
