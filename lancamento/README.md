# Project Lab — página de lançamento

## Preview

- `Project-Lab-Preview.html`: arquivo independente, com CSS, JavaScript, fonte e quatro capturas incorporados. Abra no navegador.
- `npm run dev`: desenvolvimento em http://127.0.0.1:4190/.
- `npm run package:preview`: reconstrói `dist/` e o HTML independente.
- `dist/`: versão para hospedagem estática. Antes de publicar, defina o domínio da landing page e a URL absoluta da imagem Open Graph.

## Revisão entregue

- P e L modelados a partir dos contornos da marca, com volume, bordas prismáticas, separação RGB e brilho localizado no encaixe.
- Montagem controlada pela rolagem, reversível ao subir. Sem reprodução automática. No encerramento, a logo acompanha suavemente o mouse; nas demais seções, mantém a montagem pela rolagem. O renderizador pausa quando a posição se estabiliza.
- Quatro capturas reais do aplicativo local em modo demonstração, com tema escuro nativo: Painel, Produções, Caixa e Bancada. Dados ilustrativos da demonstração.
- Logos PL em 3D nas seções Produzir, Administrar e Criar: giro completo de 360° em 12 segundos, bordas RGB, pausa manual e movimento reduzido. O giro pausa fora da tela.
- Galeria com navegação lateral no desktop e navegação em duas colunas no mobile. Imagens completas disponíveis em uma janela ampliada.
- Fonte Geist local, imagens WebP, versão estática da marca se WebGL estiver indisponível e respeito a movimento reduzido.
- Todos os acessos direcionam para https://www.projectlabstudio.com.br/.

## Verificação

Build de produção concluído; auditoria de dependências de produção sem vulnerabilidades. Preview revisado no Chrome em desktop e 390 × 844: menu, abas, navegação por teclado, ampliação, Escape, capturas incorporadas, montagem reversível e ausência de rolagem horizontal na página.

Capturas originais escuras: `output/capturas-escuras/`. O código fica isolado nesta pasta; o aplicativo principal não foi alterado.
