/*
 * lib/mortgage.js: mortgage amortization calculation library
 */

var mod_assertplus = require('assert-plus');
var VError = require('verror');

exports.createMortgage = createMortgage;

function createMortgage(args)
{
	var margs;
	var termsofar;
	var period, i;

	mod_assertplus.object(args, 'args');
	mod_assertplus.number(args.principal, 'args.principal');
	mod_assertplus.number(args.term, 'args.term');

	margs = {
	    'principal': args.principal,
	    'term': args.term,
	    'periods': []
	};

	termsofar = 0;
	mod_assertplus.arrayOfObject(args.periods, 'args.periods');
	for (i = 0; i < args.periods.length; i++) {
		period = args.periods[i];
		mod_assertplus.number(period.rate,
		    'period ' + (i + 1) + ' rate');
		if (period.period === null) {
			if (i != args.periods.length - 1) {
				return (new VError('only the last rate ' +
				    'period can have unspecified length'));
			}

			margs.periods.push({
			    'rate': period.rate,
			    'period': margs.term - termsofar
			});
			termsofar += margs.term - termsofar;
		} else {
			mod_assertplus.number(period.period,
			    'period ' + (i + 1) + ' period');
			termsofar += period.period;
			if (termsofar > margs.term) {
				return (new VError('rate periods exceed term'));
			}

			margs.periods.push({
			    'rate': period.rate,
			    'period': period.period
			});
		}
	}

	if (termsofar != margs.term) {
		return (new VError('rate periods do not add up to loan term'));
	}

	return (new Mortgage(margs));
}

function Mortgage(args)
{
	/*
	 * createMortgage already validated the input and defensively copied it.
	 */
	mod_assertplus.object(args, 'args');
	mod_assertplus.number(args.principal, 'args.principal');
	mod_assertplus.number(args.term, 'args.term');
	mod_assertplus.arrayOfObject(args.periods, 'args.periods');

	this.m_principal = args.principal;
	this.m_term = args.term;
	this.m_periods = args.periods;
	this.m_partials = null;
	this.m_schedule = null;

	this.initSchedule();
}

Mortgage.prototype.initSchedule = function ()
{
	var pleft, tleft, sched, mortgages;

	pleft = this.m_principal;
	tleft = this.m_term;
	sched = [];
	mortgages = [];

	this.m_periods.forEach(function (p) {
		var m;

		m = new SimpleMortgage(pleft, tleft, p.rate);
		pleft = m.principalLeftAfterMonth(p.period);
		tleft -= p.period;

		mortgages.push(m);
		sched = sched.concat(m.l_schedule.slice(0, p.period));
	});

	this.m_schedule = sched;
	this.m_partials = mortgages;
	mod_assertplus.ok(tleft === 0);
	mod_assertplus.ok(pleft < 0.01 * this.m_principal);
};

Mortgage.prototype.principal = function ()
{
	return (this.m_principal);
};

Mortgage.prototype.term = function ()
{
	return (this.m_term);
};

Mortgage.prototype.schedule = function ()
{
	/* XXX defensive copy */
	return (this.m_schedule.slice(0));
};

function SimpleMortgage(principal, term, rate)
{
	var mrate, p, d, i;
	var payment, pleft, ipaid, ppaid;

	mod_assertplus.number(principal, 'principal');
	mod_assertplus.number(term, 'term');
	mod_assertplus.number(rate, 'rate');

	this.l_principal = principal;
	this.l_term = term;
	this.l_rate = rate;

	mrate = rate / 12;
	this.l_mrate = mrate;

	p = Math.pow(1 + mrate, -term);
	d = 1 - p;
	payment = Math.round(100 * mrate * principal / d) / 100;
	this.l_payment = payment;

	pleft = principal;
	this.l_schedule = new Array(term);
	for (i = 0; i < term; i++) {
		ipaid = Math.round(100 * mrate * pleft) / 100;
		ppaid = payment - ipaid;
		this.l_schedule[i] = {
		    'total': payment,
		    'interest': ipaid,
		    'principal': ppaid,
		    'mrate': this.l_mrate,
		    'pbefore': pleft,
		    'pafter': pleft - ppaid
		};
		pleft -= ppaid;
	}

	mod_assertplus.ok(Math.abs(this.l_schedule[term - 1].pafter) /
	    principal < 0.01);
}

SimpleMortgage.prototype.payment = function ()
{
	return (this.l_payment);
};

SimpleMortgage.prototype.principalLeftAfterMonth = function (i)
{
	mod_assertplus.ok(i >= 0);
	mod_assertplus.ok(i <= this.l_term);
	if (i === 0)
		return (this.l_principal);
	return (this.l_schedule[i - 1].pafter);
};
