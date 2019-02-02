# First deploy scenario (interactive):

```
$ webiny deploy
$ You are not logged in! Please enter your Personal Access Token:
> {token}

(loadam listu sitova na koje imas access)

$ Which site are you deploying?
[x] bestbeerintown.webiny.com
[ ] shortmovies.webiny.com
[ ] Create a new site

(ovdje se siteId zapise u `{project_root}/.webiny` file i naredne deployeve znam koji je to site)
```

# Travis deploy
U travis se moraju setati 2 ENV varijable:
- `WEBINY_SITE_ID` (ako ova varijabla nije setana, pokusat cu procitati `{project_root}/.webiny`)
- `WEBINY_ACCESS_TOKEN`