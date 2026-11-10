# Form & Funktion

En enkel e-handelswebbplats byggd med HTML, CSS och JavaScript. Projektet simulerar ett litet onlinebutikssystem där användaren kan browse produkter, lägga till favoriter, hantera varukorgen och administrera produkter i en enkel admin-panel.

## Översikt

Form & Funktion är ett frontend-projekt som använder DummyJSON som produktkälla. Tanken är att visa hur man kan bygga en liten butiksupplevelse utan backend, med lokal lagring i webbläsaren för favoriter, varukorg och lokalt skapade produkter.

## Funktioner

- Produktkatalog med sökning, filtrering och sortering
- Startsida med utvalda produkter
- Produktdetaljsida
- Favoritfunktion med hjärta-knapp
- Varukorg med antal, summa och simulerat köp
- Admin-sida för att skapa, uppdatera och ta bort produkter
- Lagring i `localStorage` för användarspecifika ändringar
- Responsiv design för desktop och mobil

## Teknologier

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- DummyJSON API
- `localStorage` för lokal persistence

## Projektstruktur

```text
E-commerce/
├── index.html
├── products.html
├── product.html
├── favorites.html
├── cart.html
├── admin.html
├── css/
│   └── style.css
├── js/
│   ├── api.js
│   ├── products.js
│   ├── product.js
│   ├── favorites.js
│   ├── cart.js
│   └── admin.js
└── README.md
```

## Starta projektet

1. Öppna en terminal i projektmappen.
2. Starta en lokal webserver:

```bash
python -m http.server 8000
```

3. Öppna följande adress i webbläsaren:

```text
http://localhost:8000
```

> En lokal server rekommenderas eftersom projektet använder JavaScript-moduler och fetch-anrop.

## Sidor i projektet

- `index.html` – startsida med presentation och utvalda produkter
- `products.html` – katalog med sökning, kategorifilter och sortering
- `product.html` – detaljvy för en produkt
- `favorites.html` – sparade favoriter
- `cart.html` – varukorg och kassafunktion
- `admin.html` – produktadministration

## Admin-flöde

På admin-sidan kan du:

- lägga till nya produkter
- redigera befintliga produkter
- ta bort produkter från listan

Observera att ändringar sparas lokalt i browsern och visas i den aktuella webbläsaren. Eftersom DummyJSON inte sparar ändringar permanent, fungerar detta som en klientbaserad demo.

## Lagring

Projektet använder `localStorage` för följande data:

- favoriter
- varukorg
- lokalt skapade produkter
- ID för produkter som tagits bort

Det betyder att användaren kan fortsätta använda sin butikssession i samma webbläsare utan backend.

## Notering om demo

Detta är ett skolprojekt / demo-projekt. Beställningar och betalningar är simulerade och används endast för att testa flödet i butiken. Inga riktiga betalningsuppgifter samlas in eller lagras.

## Licens

Projektet är avsett för utbildnings- och demonstrationssyfte.

## Källa för produkter

Produkter hämtas från DummyJSON API:

```text
https://dummyjson.com/products
```
