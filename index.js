//	@ghasemkiani/srt

const {cutil} = require("@ghasemkiani/commonbase/cutil");
const {serializable} = require("@ghasemkiani/commonbase/serializable");
const {Base} = require("@ghasemkiani/commonbase/base");

const s2t = x => {
	x = cutil.asString(x);
	return 0 +
		1 * x.substring(9, 12) +
		1000 * x.substring(6, 8) +
		1000 * 60 * x.substring(3, 5) +
		1000 * 60 * 60 * x.substring(0, 2);
};
const t2s = x => {
	x = Math.floor(x);
	let lll = (x % 1000).toFixed(0).padStart(3, "0");
	x = Math.floor(x / 1000);
	let ss = (x % 60).toFixed(0).padStart(2, "0");
	x = Math.floor(x / 60);
	let mm = (x % 60).toFixed(0).padStart(2, "0");
	x = Math.floor(x / 60);
	let hh = (x % 60).toFixed(0).padStart(2, "0");
	let t = `${hh}:${mm}:${ss},${lll}`;
	return t;
};

class Item extends cutil.mixin(Base, serializable) {
	get text() {
		return this.lines.join(this.srt.lineDelim);
	}
	set text(text) {
		this.lines = cutil.asString(text).split(/\r?\n/g);
	}
	fromArray(array) {
		let line = array.shift();
		if (!cutil.isNumber(line)) {
			throw new Error("SRT Item fromArray: not a number!\n" + line);
		}
		this.index = cutil.asNumber(line);
		let tt = array.shift().split(this.srt.timeDelim);
		if (tt.length !== 2) {
			throw new Error("SRT Item fromArray: not a time span!\n" + tt.join(this.srt.timeDelim));
		}
		this.t1 = s2t(tt[0]);
		this.t2 = s2t(tt[1]);
		this.lines = [];
		while ((line = array.shift())) {
			this.lines.push(line);
		}
		return this;
	}
	fromString(string) {
		return this.fromArray(cutil.asString(string).split(/\r?\n/g));
	}
	toString() {
		return [
			cutil.asString(this.index),
			[t2s(this.t1), t2s(this.t2)].join(this.srt.timeDelim),
			this.text,
		].join(this.srt.lineDelim);
	}
}
cutil.extend(Item.prototype, {
	srt: null,
	index: null,
	lines: null,
	t1: null,
	t2: null,
});

class Srt extends cutil.mixin(Base, serializable) {
	get items() {
		if (!this._items) {
			this._items = [];
		}
		return this._items;
	}
	set items(items) {
		this._items = items;
	}
	reset() {
		this._items = null;
	}
	fromString(string) {
		let lines = cutil.asString(string).split(/\r?\n/g);
		let srt = this;
		while (lines.length > 1) {
			this.items.push(new Item({srt}).fromArray(lines));
		}
		return this;
	}
	toString() {
		return this.items.map(item => item.toString()).join(this.lineDelim + this.lineDelim);
	}
	move(d) {
		for(let item of this.items) {
			item.t1 += d;
			item.t2 += d;
		};
		return this;
	}
	scale(r) {
		for(let item of this.items) {
			item.t1 *= r;
			item.t2 *= r;
		};
		return this;
	}
}
cutil.extend(Srt.prototype, {
	timeDelim: " --> ",
	lineDelim: "\n",
	_items: null,
});

module.exports = {Item, Srt};
