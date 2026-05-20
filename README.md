# Asystent zadań na iOS

Lekka aplikacja PWA do pilnowania zadań, zobowiązań i celów. Działa lokalnie w przeglądarce, zapisuje dane w pamięci urządzenia i może wysyłać powiadomienia, gdy aplikacja jest aktywna oraz ma zgodę na powiadomienia.

## Uruchomienie

Otwórz folder w dowolnym statycznym serwerze HTTP i wejdź na adres aplikacji w Safari.

Przykładowo, jeśli masz dostępny Python:

```bash
python -m http.server 4173
```

Potem otwórz:

```text
http://localhost:4173/
```

## Instalacja na iPhone

1. Otwórz adres aplikacji w Safari.
2. Naciśnij ikonę udostępniania.
3. Wybierz `Dodaj do ekranu początkowego`.
4. Uruchamiaj aplikację z ikony `Asystent`.

## Ważne na iOS

Przypomnienia w tle na iPhonie są ograniczone dla zwykłych stron. Ta wersja przypomina, gdy aplikacja jest otwarta lub aktywna. Pełne powiadomienia działające niezależnie od uruchomionej aplikacji wymagają natywnej wersji iOS albo Web Push z backendem.

## Publikacja na GitHub Pages

1. Utwórz publiczne repozytorium na GitHubie, np. `twoj-plan`.
2. Wgraj do repozytorium wszystkie pliki z tego folderu.
3. Wejdź w `Settings` -> `Pages`.
4. Ustaw `Source` na `Deploy from a branch`.
5. Wybierz branch `main` i folder `/root`.
6. Po zapisaniu GitHub poda adres w stylu `https://twoj-login.github.io/twoj-plan/`.

Po wejściu na ten adres w Safari możesz użyć `Udostępnij` -> `Dodaj do ekranu początkowego`.
