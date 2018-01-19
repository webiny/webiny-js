import Entity from './entity';

class DateEntity extends Entity {
	constructor() {
		super();
		this.attr('name').char();
		this.attr('createdOn').date();
	}
}

DateEntity.classId = 'DateEntity';
export default DateEntity;