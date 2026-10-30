import db from './database.js';

function calculerDistance(lat1, lng1, lat2, lng2) {
	const rayonTerre = 6371000;
	const rad = Math.PI / 180;

	const diffLat = (lat2 - lat1) * rad;
	const diffLng = (lng2 - lng1) * rad;

	const a =
		Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
		Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(diffLng / 2) * Math.sin(diffLng / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return rayonTerre * c;
}

export async function load({ url, fetch }) {
	const adresse = (url.searchParams.get('adresse') || '').trim();

	const restaurants = db
		.prepare(
			'SELECT id, name, tagline, description, price_tier, rating_avg, rating_count, street_address, postcode, neighborhood, latitude, longitude FROM restaurants WHERE listing_status = ?'
		)
		.all('published');

	for (let restaurant of restaurants) {
		restaurant.photos = db
			.prepare('SELECT url, caption, alt_text FROM photos WHERE restaurant_id = ? ORDER BY position')
			.all(restaurant.id);

		restaurant.tags = db
			.prepare(
				'SELECT tags.name FROM tags JOIN restaurant_tags ON restaurant_tags.tag_id = tags.id WHERE restaurant_tags.restaurant_id = ? ORDER BY restaurant_tags.position'
			)
			.all(restaurant.id);
	}

	if (adresse === '') {
		return { restaurants, adresse, centre: null, erreur: '' };
	}

	if (adresse.length > 200) {
		return { restaurants, adresse, centre: null, erreur: 'Adresse trop longue' };
	}

	let resultats = [];

	try {
		const reponse = await fetch(
			'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
				encodeURIComponent(adresse),
			{ headers: { 'User-Agent': 'tastemap-projet-ecole' } }
		);
		resultats = await reponse.json();
	} catch (erreur) {
		return { restaurants, adresse, centre: null, erreur: "La recherche d'adresse a échoué" };
	}

	if (resultats.length === 0) {
		return { restaurants, adresse, centre: null, erreur: 'Adresse introuvable' };
	}

	const centre = {
		lat: Number(resultats[0].lat),
		lng: Number(resultats[0].lon)
	};

	const proches = [];

	for (let restaurant of restaurants) {
		const distance = calculerDistance(
			centre.lat,
			centre.lng,
			restaurant.latitude,
			restaurant.longitude
		);

		if (distance <= 1000) {
			restaurant.distance = Math.round(distance);
			proches.push(restaurant);
		}
	}

	proches.sort(function (a, b) {
		return a.distance - b.distance;
	});

	return { restaurants: proches, adresse, centre, erreur: '' };
}