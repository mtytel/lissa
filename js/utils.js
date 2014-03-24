/**
 * Lissa Juice: Online audio visualization
 *
 * Matt Tytel and Noura Howell
 *
 * Copyright (c) 2013
 * Under MIT and GPL licenses:
 *  http://www.opensource.org/licenses/mit-license.php
 *  http://www.gnu.org/licenses/gpl.html
 */

lissa.utils ={};

lissa.utils.random_int = function(low, high) {
  return Math.floor((high - low + 1) * Math.random()) + low;
};
