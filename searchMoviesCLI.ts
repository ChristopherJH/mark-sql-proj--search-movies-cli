import { keyInSelect, keyInYN, question } from "readline-sync";
import { Client, QueryResult } from "pg";

//As your database is on your local machine, with default port,
//and default username and password,
//we only need to specify the (non-default) database name.
const client = new Client({ database: 'omdb' });

async function main() {
    let quit = false
    const options = ['Search', 'See favourites']
    await client.connect()
    console.log("Welcome to search-movies-cli!");
    while (quit===false) {
        const indexOption = keyInSelect(options, "What would you like to do?") + 1
        switch(indexOption) {
            case 1:
                await searchMovie()
                break;
            case 2:
                await seeFavourities()
                break;
            default:
                console.log("Quitting...")
                quit = true
        }
    }
    await client.end();
}

async function searchMovie() {
    const searchString = question("Search for a movie or person: ").toLowerCase()
    if (searchString === '' || searchString === ' ') {
        console.log('Search term was empty.')
    } else {
        const searchStringFirstLetterUppercase = searchString[0].toUpperCase() + searchString.slice(1)
        console.log(`Searching for '${searchString}':`)

        const text = "SELECT movie_id, movie_name, date, runtime, person_name AS lead_actor, budget, revenue, vote_average, votes_count FROM casts_view WHERE movie_name LIKE $1 OR movie_name LIKE $2 AND person_name LIKE $1 OR person_name LIKE $2 AND kind = $3 AND position = 1 ORDER BY date DESC LIMIT 9"
        const values = [`%${searchString}%`, `%${searchStringFirstLetterUppercase}%`, 'movie']
        const res = await client.query(text, values)
        console.table(res.rows)
        if (keyInYN("Would you like to add any of these movies to your favourites?")) {
            addToFavourites(res)
        }
    }
}

async function addToFavourites(res: QueryResult) {
    console.log('Add to favourites in progress..')
    const movieOptions = res.rows.map((field) => field.name);
    const favIndexOption = keyInSelect(movieOptions, "Which movie would you like to add to your favourites?") + 1
    if (favIndexOption !== 0) {
        const movieIdToAdd = res.rows[favIndexOption].id
        const text = "INSERT INTO favourites (movie_id) VALUES ($1)"
        const values = [movieIdToAdd]
        console.log(`Adding ${res.rows[favIndexOption].name} to your favourites.`)
        await client.query(text, values)
        console.log(`${res.rows[favIndexOption].name} was added to your favourites.`)
    } else {
        console.log("No movie was added to your favourites.")
    }
}

async function seeFavourities() {
    console.log('See favourites in progress..')
    const text = "SELECT * FROM favourites"
    const result = await client.query(text)
    console.table(result.rows)
}

main()