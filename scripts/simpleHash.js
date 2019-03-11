// credit: https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
// this is a non-cryptographic hash function, 
// i.e. won't stop a determined and knowledgeable attacker.
// however, this is a very low-security app, so I'm ok with that.
// it will suffice to stop a casual user glancing at the console -
// - not to stop them from logging in as someone else (still easy) 
// but from guessing some else's password.
// they could still easily change someone else's password -
// - they just can't guess it.  Unless they try really hard.
// security rating: 0.5 stars.
String.prototype.hashCode = function() {
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};