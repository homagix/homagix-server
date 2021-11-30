# Homagix server

Food shopping isn't fun. Especially if you have children and need or want to cook every day and those children aren't very interested in experimenting with new dishes. So, sonner or later, you will do the same few dishes again and again. I don't like this.

Sometimes, we _find_ some new dishes which are accepted by the children. I want to remember these. Unless then, I want to use all known dishes in a way that variety is maximized.

To do this in a more digital way, we created this repository to remember dishes, get more variety as well as simplify food shopping by having a list of ingredients which are needed for the dishes.

## Program parts

This is the server part of Homagix. It is most likely that you want to clone [the frontend part](https://github.com/jschirrmacher/homagix-frontend) as well.

## Adding recipes

Dishes are stored in a `/data/dishes` folder using YAML format. This looks like in this example:

    ---
    name: Honig-Camembert
    items:
      - 4 Stk Camembert
      - 2 Stk Süßkartoffeln
      - 400 kg Äpfel
      - 200 g Instant-Linsen
      - 1 Bund Frühlingszwiebeln
      - 8 Stk Walnüsse
      - 200 g Rucola
      - 40 g Honig
      - 20 g Senf
    recipe: >
      Süßkartoffeln schälen und würfeln, in einem Topf mit Öl, Salz und Pfeffer
      vermengen und auf ein Backblech legen. Im Ofen ca. 20 Minuten backen. Linsen
      in klarem Wasser ausspülen. Äpfel waschen, entkernen und in Scheiben
      schneiden. Camemberts auf einem zweiten Backblech verteilen, mit der Hälfte
      des Honigs einstreichen und mit den Apfelscheiben dazwischen ca. 12 Minuten
      bei 180°C im Ofen backen, bis der Apfel weich ist. In einer Pfanne die
      Frühlingszwiebelringe in Öl anschwitzen, Linsen dazu geben und 3 Minuten
      anbraten. Mit Salz und Pfeffer abschmecken. Restlichen Honig, Senf, Öl, 5 EL
      Wasser und etwas Essig in einer Salatschüssel zu einem Dressing mischen.
      Rucola und Linsen dazu geben und mit Salz und Pfeffer abschmecken.
    image: IMG_4055.jpg

The image must be placed in `/data/images`.

Make sure that you use the correct format `amount unit name` for each ingredient and use only the units
defined in [/server/models/units.js](./blob/master/server/models/units.js)

You need to restart the server when you add a new dish or make changes to an existing one.

## Install and run

    git clone https://github.com/jschirrmacher/homagix-server.git
    npm install --production
    # Add some dishes (as described above) in `/data/dishes`.
    npm start

Alternatively, if you have [Docker](https://docs.docker.com/get-docker/) installed, you can use [a Docker image](https://hub.docker.com/r/joschi64/homagix). To use it, create a `data` folder locally containing some dishes you want to use, and enter this command:

    docker run -it --rm -v ${pwd}/data:/app/data -p 8200:8200 joschi64/homagix

You should set the configuration to match your environment. To do this, copy `.env` to `.env.production` and
change whatever is nececessary. Please note, that changing `SECRET` will make stored password hashes invalid,
so all users need to reset their passwords. This requires that the SMTP settings specify a valid SMTP server.

If you use the docker image, you can set the environment via `-e` parameters, or, you could mount the `.env.production` file too, by adding `-v ${pwd}/.env.production:/app/.env.production`.
