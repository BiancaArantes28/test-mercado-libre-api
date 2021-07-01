import * as restify from 'restify';
import fetch from 'node-fetch';

const server = restify.createServer({
    name: 'mercado-libre',
    version: '1.0.0'
});

const promise = (fetchPromise) => {
    return new Promise((resolve, reject) => {
        fetchPromise.then((result) => {
            result.json().then((jsonResult) => {
                resolve(jsonResult)
            })
        })
        .catch((error) => {
            reject(error);
        })
    })
}

const fetchApi = (url) => {
    return promise(fetch(url))
}

server.use(restify.plugins.queryParser())

const getProducts = async (q): Promise<any> => {
    return (await fetchApi(`https://api.mercadolibre.com/sites/MLA/search?q=${q}`))
}
server.get('/api/items', (req, resp, next) => {
    let p = req.query;
    (async () => {
        const products = await getProducts(p.q);
        let productsResult =  products.results.map((product) => {
            return {
                id: product.id,
                title: product.title,
                price: {
                    currency: product.prices.presentation.display_currency,
                    amount: product.price,
                    decimals: 0,
                },
                picture: product.thumbnail,
                condition: product.condition,
                free_shipping: product.shipping.free_shipping,
                state_name: product.address.state_name
            }
        });
        let getCategories = products.filters.filter(p => p.id === "category");
        
        let categories = [];
        for (let i = 0; i < getCategories[0].values.length; i++) {
            categories.push(getCategories[0].values[i].path_from_root.map(path => path.name));
        }
        resp.json({ 
            author: {
                name: "Bianca",
                lastname: "Arantes"
            },
            items: productsResult, 
            categories: categories[0] 
        });
    })().catch((err) => {
        console.log(err);
    });
    
    return next();
});

server.listen(8086, () => {
    console.log('API is running on http://localhost:8086');
});
