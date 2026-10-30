<script>
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';

	let { data } = $props();

	let carte;
	let restaurantChoisi = $state(null);

	onMount(async () => {
		const leaflet = await import('leaflet');
		const L = leaflet.default;

		let centreCarte = [51.5246, -0.0743];

		if (data.centre) {
			centreCarte = [data.centre.lat, data.centre.lng];
		}

		carte = L.map('carte').setView(centreCarte, 14);

		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap'
		}).addTo(carte);

		if (data.centre) {
			L.circle(centreCarte, {
				radius: 1000,
				color: '#3d6b4a',
				weight: 2,
				fillOpacity: 0.05
			}).addTo(carte);
		}

		data.restaurants.forEach(function (restaurant, i) {
			const icone = L.divIcon({
				className: 'pin',
				html: String(i + 1),
				iconSize: [32, 32]
			});

			const point = L.marker([restaurant.latitude, restaurant.longitude], { icon: icone });

			point.addTo(carte);
			point.on('click', function () {
				restaurantChoisi = restaurant;
			});
		});
	});
</script>

<div class="page">
	<div class="panneau">
		{#if restaurantChoisi}
			<button class="retour" onclick={() => (restaurantChoisi = null)}>
				← Back to all places
			</button>

			<div class="photos">
				{#each restaurantChoisi.photos as photo}
					<img src={photo.url} alt={photo.alt_text} title={photo.caption} />
				{/each}
			</div>

			<h2>{restaurantChoisi.name}</h2>

			<div class="infos">
				{#each restaurantChoisi.tags as tag}
					<span class="tag">{tag.name}</span>
				{/each}
				<span>{'€'.repeat(restaurantChoisi.price_tier)}</span>
				<span>★ {restaurantChoisi.rating_avg} ({restaurantChoisi.rating_count} reviews)</span>
			</div>

			<p>{restaurantChoisi.description}</p>

			<p class="adresse">
				{restaurantChoisi.street_address}, {restaurantChoisi.postcode} · {restaurantChoisi.neighborhood}
			</p>
		{:else}
			<h1 class="logo">Tastemap.</h1>
			<h2>Your top tables</h2>

			{#if data.erreur}
				<p class="erreur">{data.erreur}</p>
			{/if}

			{#if data.centre}
				<p class="info">{data.restaurants.length} restaurant(s) dans un rayon de 1 km</p>
			{/if}

			<ul class="liste">
				{#each data.restaurants as restaurant, i}
					<li>
						<button class="ligne" onclick={() => (restaurantChoisi = restaurant)}>
							<span class="numero">{i + 1}</span>
							<span class="texte">
								<strong>{restaurant.name}</strong>
								<span>{restaurant.tagline} · {restaurant.neighborhood}</span>
								{#if restaurant.distance !== undefined}
									<span>{restaurant.distance} m</span>
								{/if}
							</span>
							<span class="prix">{'€'.repeat(restaurant.price_tier)}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="zone-carte">
		<form class="barre-recherche" method="GET" data-sveltekit-reload>
			<input
				type="text"
				name="adresse"
				value={data.adresse}
				placeholder="Redchurch St, Shoreditch, London"
			/>
			<span class="rayon">1km radius</span>
			<button type="submit">Search</button>
		</form>

		<button class="bouton-owner">Owner of restaurant ?</button>

		<div id="carte"></div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: sans-serif;
	}

	:global(.pin) {
		background: #3d6b4a;
		color: white;
		border: 2px solid white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 14px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
	}

	.page {
		display: flex;
		height: 100vh;
	}

	.panneau {
		width: 350px;
		background: #fafaf6;
		padding: 20px;
		overflow-y: auto;
		box-sizing: border-box;
	}

	.logo {
		font-family: Georgia, serif;
		font-size: 22px;
		margin: 0 0 20px 0;
	}

	h2 {
		font-family: Georgia, serif;
		font-size: 28px;
		margin: 0 0 15px 0;
	}

	.info {
		font-size: 13px;
		color: #3d6b4a;
	}

	.erreur {
		color: #b3261e;
		font-size: 14px;
	}

	.liste {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.ligne {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px 0;
		border: none;
		border-bottom: 1px solid #e5e5dc;
		background: none;
		text-align: left;
		font-size: 16px;
		cursor: pointer;
	}

	.ligne:hover {
		background: #f0eee2;
	}

	.numero {
		font-family: Georgia, serif;
		font-size: 20px;
		width: 24px;
		text-align: center;
	}

	.texte {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.texte span {
		font-size: 13px;
		color: #666;
	}

	.prix {
		font-size: 13px;
		color: #444;
	}

	.retour {
		background: none;
		border: none;
		font-size: 14px;
		cursor: pointer;
		padding: 0;
		margin-bottom: 15px;
	}

	.photos {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		margin-bottom: 15px;
	}

	.photos img {
		width: 100%;
		height: 100px;
		object-fit: cover;
		background: #ddd;
		border-radius: 6px;
	}

	.photos img:first-child {
		grid-column: span 2;
		height: 170px;
	}

	.infos {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		margin-bottom: 10px;
	}

	.tag {
		background: #e5e5dc;
		border-radius: 10px;
		padding: 2px 8px;
		font-size: 12px;
		text-transform: uppercase;
	}

	.adresse {
		font-size: 14px;
		color: #444;
	}

	.zone-carte {
		position: relative;
		flex: 1;
	}

	#carte {
		height: 100%;
		width: 100%;
	}

	.barre-recherche {
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		background: white;
		border-radius: 30px;
		padding: 10px 20px;
		width: 440px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		gap: 10px;
		box-sizing: border-box;
	}

	.barre-recherche input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 14px;
	}

	.rayon {
		background: #eee;
		border-radius: 10px;
		padding: 2px 8px;
		font-size: 11px;
	}

	.barre-recherche button {
		background: none;
		border: none;
		color: #3d6b4a;
		font-weight: bold;
		cursor: pointer;
	}

	.bouton-owner {
		position: absolute;
		top: 20px;
		right: 20px;
		z-index: 1000;
		background: #3d6b4a;
		color: white;
		border: none;
		border-radius: 20px;
		padding: 10px 18px;
		font-weight: bold;
		cursor: pointer;
	}
</style>