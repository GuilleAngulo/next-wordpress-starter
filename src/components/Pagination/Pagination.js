import { BsArrowLeft, BsArrowRight } from 'react-icons/bs';
import styles from './Pagination.module.scss';

const Pagination = ({ hasPreviousPage = false, hasNextPage = false, handlePrev, handleNext }) => {
  return (
    <div className={styles.nav}>
      {hasPreviousPage && (
        <a className={styles.prev} aria-label="Previous Posts" onClick={handlePrev}>
          {' '}
          <BsArrowLeft /> Previous
        </a>
      )}
      {hasNextPage && (
        <a className={styles.next} aria-label="Next Posts" onClick={handleNext}>
          {' '}
          Next <BsArrowRight />
        </a>
      )}
    </div>
  );
};

export default Pagination;
