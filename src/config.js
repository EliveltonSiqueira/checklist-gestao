/* ============ CONFIGURAÇÃO — edite aqui para mudar empresa, lojas e itens ============ */
export const EMPRESA = "Super Vilton";
export const MARCA = "DeltaZero"; // crédito de desenvolvimento (tela e PDF)
export const LOJAS = ["Loja 01", "Loja 02"];

/* foto:true = item com botão de foto sempre visível.
   Nos demais, o botão de foto aparece quando o item é marcado "Não conforme". */
export const CHECKLISTS = {
  abertura: {
    titulo: "Checklist Gestão Abertura",
    grupos: [
      { nome: "Estrutura e limpeza", itens: [
        { t: "Verificar iluminação da loja", foto: true },
        { t: "Ar-condicionado da loja está funcionando" },
        { t: "Limpeza dos banheiros de clientes", foto: true },
        { t: "Limpeza dos banheiros de funcionários", foto: true },
        { t: "Limpeza da entrada da loja antes da entrada de clientes", foto: true },
        { t: "Limpeza da calçada e áreas externas", foto: true },
        { t: "Carrinhos, cestinhas e equipamentos retirados para a calçada e disponíveis para os clientes", foto: true },
        { t: "Abastecimento de coolers e mesas / exposições da entrada de loja", foto: true },
        { t: "Limpeza geral do piso da loja", foto: true },
      ]},
      { nome: "Pessoal e equipamentos", itens: [
        { t: "Funcionamento do refeitório" },
        { t: "Funcionamento dos equipamentos: ilhas, geladeiras, serras, máquinas de resinite, entre outros" },
        { t: "Quadro de pessoal: verificar se as quantidades atendem a demanda de abertura" },
      ]},
      { nome: "Abastecimento e precificação", itens: [
        { t: "Verificar pontos de oportunidade de abastecimento da mercearia", foto: true },
        { t: "Alteração de preços de gôndolas realizada", foto: true },
        { t: "Cartazeamento externo do encarte vigente", foto: true },
        { t: "Cartazeamento de pontas de gôndolas e pontos extras", foto: true },
      ]},
      { nome: "Frente de loja e setores", itens: [
        { t: "Abertura e organização da frente de loja", foto: true },
        { t: "Abertura e organização do setor de Rotisseria e Padaria", foto: true },
        { t: "Abertura e organização do setor de Frios", foto: true },
        { t: "Abertura e organização do setor de Peixaria", foto: true },
        { t: "Abertura e organização do setor de Açougue", foto: true },
        { t: "Abertura e organização do setor de Horti", foto: true },
        { t: "Demandas de insumos, uso e consumo atendidas para abertura dos setores" },
        { t: "Padrão de fardamento e vestimentas em conformidade", foto: true },
      ]},
    ]
  },
  fechamento: {
    titulo: "Checklist Gestão Fechamento",
    grupos: [
      { nome: "Pessoal e operação", itens: [
        { t: "Quadro de pessoal: verificar se as quantidades atendem a demanda de fechamento. Início da jornada 13:40 — se apresentar nos setores" },
        { t: "Reabertura dos setores em conformidade com o mesmo padrão de abertura e qualidade", foto: true },
        { t: "Quantidade de operadores e caixas em conformidade com a demanda e necessidades do dia" },
      ]},
      { nome: "Estrutura e limpeza", itens: [
        { t: "Ar-condicionado e iluminação adequados ao funcionamento da operação" },
        { t: "Limpeza dos banheiros de clientes", foto: true },
        { t: "Limpeza dos banheiros de funcionários", foto: true },
        { t: "Funcionamento do refeitório atendeu as demandas do dia" },
        { t: "Funcionamento dos equipamentos: ilhas, geladeiras, serras, máquinas de resinite, entre outros" },
      ]},
      { nome: "Padaria e rotisseria", itens: [
        { t: "Encerramento e retirada dos produtos de padaria e rotisseria às 21h", foto: true },
        { t: "Pães telados para o dia seguinte: 2 carrinhos fora da área de refrigeração e 1 carrinho dentro da área de refrigeração", foto: true },
      ]},
      { nome: "Frente de loja e área externa", itens: [
        { t: "Retirada de carrinhos de dentro da loja e fechamento da área de carrinhos", foto: true },
        { t: "Acompanhar encerramento do setor de entregas" },
        { t: "Retirados os preços de encartes finalizados no dia", foto: true },
        { t: "Retirados e trocados os cartazes externos", foto: true },
        { t: "Devoluções zeradas", foto: true },
        { t: "Retirada de produtos e sacolas dos caixas, limpeza dos caixas e organização da frente de loja", foto: true },
      ]},
      { nome: "Setores", itens: [
        { t: "Limpeza e organização do setor de Rotisseria e Padaria", foto: true },
        { t: "Limpeza e organização do setor de Frios", foto: true },
        { t: "Limpeza e organização do setor de Peixaria", foto: true },
        { t: "Limpeza e organização do setor de Açougue", foto: true },
        { t: "Limpeza e organização do setor de Horti", foto: true },
      ]},
      { nome: "Encerramento", itens: [
        { t: "Luzes apagadas no encerramento", foto: true },
        { t: "Ar-condicionado desligado a partir das 20:30h" },
        { t: "Piso e loja limpos e organizados pela equipe de limpeza para o dia seguinte", foto: true },
        { t: "Recolhidas as exposições refrigeradas dos coolers, exposição de peixes, entre outros", foto: true },
        { t: "Fechamento de loja acompanhado junto com a prevenção" },
        { t: "Nenhum colaborador em loja, todos seguindo para seu destino" },
      ]},
    ]
  }
};
export const STATUS = { C: "Conforme", NC: "Não conforme", NA: "Não se aplica" };
