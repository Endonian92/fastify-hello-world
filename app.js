const port = process.env.PORT || 3000;
const host = ("RENDER" in process.env) ? `0.0.0.0` : `localhost`;

//注文ボタンをリセットボタンに変える悪魔の変数
var reset = false;
//変数ここまで
const path = require("path");
// Require the fastify framework and instantiate it
const fastify = require("fastify")({
	// Set this to true for detailed logging:
	logger: false,
});
const fs = require("fs");

// ADD FAVORITES ARRAY VARIABLE FROM TODO HERE

// Setup our static files
fastify.register(require("@fastify/static"), {
	root: path.join(__dirname, "public"),
	prefix: "/", // optional: default '/'
});

// Formbody lets us parse incoming forms
fastify.register(require("@fastify/formbody"));

// View is a templating manager for fastify
fastify.register(require("@fastify/view"), {
	engine: {
		handlebars: require("handlebars"),
	},
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
	seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

/**
 * Our home page route
 *
 * Returns src/pages/index.hbs with data built into it
 */
let wait_num = 0;
let exe_num = 0;
fastify.get("/", function (request, reply) {
	//params = {}
	return reply.view("/src/pages/index.hbs" /*, params*/);
});

fastify.get("/pass", function (request, reply) {
	//params = {}
	// return reply.view("/src/pages/pass.hbs"/*, params*/);
	return reply.view("/src/pages/pass.hbs" /*, params*/);
});
fastify.get("/admin", function (request, reply) {
	//params = {}
	return reply.view("/src/pages/admin.hbs" /*, params*/);
});

fastify.post("/pass", (req, reply) => {
  const num = wait_num++
  while(num>exe_num){}
	const input = JSON.parse(req.body);
	const accept = input.pass === process.env.PASS;
	const date = new Date(Date.now() + (new Date().getTimezoneOffset() + 9 * 60) * 60 * 1000);
	const ip = req.headers["x-forwarded-for"];
	const log = `${date} | ${ip} | ${input.name} | ${accept}\n`;
	fs.appendFileSync("./logger.log", log, "utf8");
	return { accept, postPass: process.env.POSTPASS };
  exe_num++
});

fastify.get("/data", function (request, reply) {
	reply.type("application/json").code(200);
	return JSON.parse(fs.readFileSync("./data.json", "utf8"));
});

fastify.post("/data", function ({ body }, reply) {
  const num =wait_num++
  while(num>exe_num){}
	/*
    送信テンプレ
    {berry: (注文数。レジ側からは負の数でrequest),
    choco: (注文数。レジ側からは負の数でrequest)}
  */
	const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
	const { berry, choco, postPass } = JSON.parse(body);
	console.log(body);
	if (postPass == process.env.POSTPASS) {
		data.berry.ordered += Math.max(0, berry);
		data.berry.claimed += -Math.min(0, berry);
		data.choco.ordered += Math.max(0, choco);
		data.choco.claimed += -Math.min(0, choco);
		data.berry.earn = data.berry.ordered * 100;
		data.choco.earn = data.choco.ordered * 100;
		if (reset == true) {
			data.berry.ordered = 0;
			data.berry.claimed = 0;
			data.berry.earn = 0;
			data.choco.ordered = 0;
			data.choco.claimed = 0;
			data.choco.earn = 0;
		}
		fs.writeFileSync("./data.json", JSON.stringify(data), "utf8");
		reply.type("application/json").code(200);
    exe_num++
		return { data: "返すものなんもないのでルートに戻っとけ" };
	} else {
		reply.type("application/json").code(401);
    exe_num++
	}
});

fastify.post("/ordered", function ({ body }, reply) {
  const num =wait_num++
  while(num>exe_num){}
	try {
		/*
    送信テンプレ
   {ordered_num: 番号,
    berry: (注文数),
    choco: (注文数),
    time: YYYYMMDDHHMMSS,
    calling:false
    claim: false}
  */
		var data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
		// console.log(data)
		const receive = JSON.parse(body);
		const ordered_number = data.order_log.length + 1;
		if (receive.postPass == process.env.POSTPASS) {
			if (receive.claim) {
				for (let i = 0; i < ordered_number - 1; i++) {
					if (receive.ordered_num == data.order_log[i].ordered_num) {
						data.order_log[i].claimed = true;
					}
				}
			} else if (receive.calling) {
				for (let i = 0; i < ordered_number - 1; i++) {
					if (receive.ordered_num == data.order_log[i].ordered_num) {
						data.order_log[i].calling = true;
					}
				}
			} else {
				const new_data = {
					ordered_num: ordered_number,
					berry: receive.berry,
					choco: receive.choco,
					order_time: receive.order_time,
					calling: false,
					claimed: false,
				};
				data.order_log = reset ? [] : [...data.order_log, new_data];
			}
			fs.writeFileSync("./data.json", JSON.stringify(data), "utf8");
			reply.type("application/json").code(200);
      exe_num++
			return { data: reset ? "resetted" : ordered_number, comment: "ルートに戻っとけ" };
		} else {
			reply.type("application/json").code(401);
      exe_num++
		}
	} catch (e) {
		console.log(e);
	}
});

// Run the server and report out to the logs
fastify.listen({ port: process.env.PORT, host: "0.0.0.0" }, function (err, address) {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Your app is listening on ${address}`);
});

